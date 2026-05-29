// scripts/fix-from-audit.mjs
//
// Revise articles using the structured fact-check data from audit-accuracy-claude.
// For each article:
//   1. Load the MDX + parsed frontmatter + body
//   2. Load the matching audit-reports/<slug>.json
//   3. Send to Claude with explicit instructions:
//        - Preserve VERIFIED claims verbatim
//        - Replace CONTRADICTED claims with the audit's correctFact
//        - Resolve INTERNAL_CONTRADICTIONs
//        - Preserve affiliate link block + H2 structure + tone + length
//        - Do NOT invent new specific claims
//   4. Write the revised body back (frontmatter unchanged)
//   5. Re-audit the revised article (optional)
//
// USAGE:
//   node scripts/fix-from-audit.mjs --slug=foo
//   node scripts/fix-from-audit.mjs --limit=5
//   node scripts/fix-from-audit.mjs
//   node scripts/fix-from-audit.mjs --action=REVISE
//   node scripts/fix-from-audit.mjs --no-reaudit
//   node scripts/fix-from-audit.mjs --concurrency=2
//   node scripts/fix-from-audit.mjs --dry-run
//
// ENV:
//   ANTHROPIC_API_KEY (required)
//   FIX_MODEL (default: claude-opus-4-7)

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env", override: false });

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const AUDIT_DIR = path.join(ROOT, "audit-reports");
const FIX_REPORTS_DIR = path.join(ROOT, "fix-reports");
const MODEL = process.env.FIX_MODEL || "claude-opus-4-7";

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
);

const onlySlug = typeof flags.slug === "string" ? flags.slug : null;
const limit = flags.limit ? Number(flags.limit) : null;
const action = typeof flags.action === "string" ? flags.action : "UNPUBLISH";
const concurrency = flags.concurrency ? Number(flags.concurrency) : 2;
const reaudit = !flags["no-reaudit"];
const dryRun = Boolean(flags["dry-run"]);

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a technical editor revising a consumer electronics troubleshooting article for a site covering TVs, AV receivers, soundbars, streaming devices, HDMI connections, and gaming consoles. A search-grounded fact-checker has audited the article and flagged specific claims as VERIFIED, CONTRADICTED, UNVERIFIABLE, or INTERNAL_CONTRADICTION. Each non-verified claim comes with a correctFact and often a source URL.

Your job: produce a revised article body that fixes the errors and ships clean. Follow these rules EXACTLY.

PRESERVE:
- Every VERIFIED claim — verbatim, word-for-word.
- The article's H2 section structure (same headings, same order).
- The affiliate link block — the markdown lines that contain "(paid link)". Do not remove, reorder, or alter these.
- The tone (calm, clear, technically competent, consumer-friendly).
- Approximate length (within ±20% of original word count).
- Any factually-correct content that was not flagged at all.

FIX:
- CONTRADICTED claims: replace with the correctFact. When the audit provides a source URL, you may cite it inline as "(per [Brand's product page](URL))" — only if the URL was supplied by the audit.
- INTERNAL_CONTRADICTION claims: reconcile by picking the version supported by the audit's correctFact guidance. Delete or rewrite the wrong version.
- UNVERIFIABLE claims: add hedging language ("reportedly", "according to some reports") or replace with manual-referring defaults ("check your TV's settings menu" or "consult the product manual").

KEY AV ACCURACY RULES (apply to ALL fixes):
- Samsung does NOT support Dolby Vision — use HDR10+ instead.
- Optical/TOSLINK cannot carry Dolby Atmos, DTS:X, or any lossless audio.
- HDMI 2.0 maxes at 4K@60Hz; HDMI 2.1 is needed for 4K@120Hz.
- Nintendo Switch → 1080p docked, 720p handheld (no 4K).
- Fire TV Stick Lite → 1080p only (not 4K).
- Xbox Series S → 1440p game rendering (not 4K gaming).
- ARC (standard) carries compressed audio only; eARC carries lossless.
- Never write "HDMI 2.1 cable" or "HDMI 2.0 cable" — cables have speed ratings (Certified Ultra High Speed = 48Gbps).
- CEC names: Samsung=Anynet+, LG=SimpLink, Sony=Bravia Sync.

DO NOT:
- Invent new specific claims (new format support, port specs, model numbers) not in the original article or the audit's correctFact.
- Change the article's brand focus, product recommendation, or affiliate URL.
- Remove whole sections (Quick Answer, Symptoms, Quick Checks, Step-by-Step Fix, If It Still Isn't Working, FAQ). Rewrite shorter rather than deleting.
- Add editorial commentary about the fix.
- Output anything except the revised article body.

OUTPUT FORMAT:
Return ONLY the revised article body inside a single \`\`\`mdx fenced code block. No prose before or after. The body should begin with the first H2 heading (## Quick answer) — no H1, no frontmatter.`;

// ─── USER PROMPT ─────────────────────────────────────────────────────────────

function formatClaim(c, idx) {
  const parts = [
    `[${idx}] "${c.claim}"`,
    `    section: ${c.section || "unspecified"}`,
    `    status: ${c.status}${c.severity ? ` (${c.severity})` : ""}`,
  ];
  if (c.correctFact) parts.push(`    correctFact: ${c.correctFact}`);
  if (c.source) parts.push(`    source: ${c.source}`);
  return parts.join("\n");
}

function buildUserPrompt(article, auditReport) {
  const claims = auditReport.claims || [];
  const actionable = claims.filter(
    (c) =>
      c.status === "CONTRADICTED" ||
      c.status === "INTERNAL_CONTRADICTION" ||
      c.status === "UNVERIFIABLE",
  );
  const verified = claims.filter((c) => c.status === "VERIFIED");

  return (
    `ARTICLE TITLE: ${article.frontmatter.title || article.slug}\n` +
    `BRAND: ${article.frontmatter.brand || "unspecified"}\n` +
    `CATEGORY: ${article.frontmatter.category || "unspecified"}\n\n` +
    `AUDIT SUMMARY: ${auditReport.summary || "(none)"}\n\n` +
    `CLAIMS TO FIX (${actionable.length}):\n` +
    (actionable.length === 0
      ? "  (none)\n"
      : actionable.map(formatClaim).join("\n\n") + "\n") +
    `\nCLAIMS TO PRESERVE VERBATIM (${verified.length}):\n` +
    (verified.length === 0
      ? "  (none)\n"
      : verified.map(formatClaim).join("\n\n") + "\n") +
    `\nORIGINAL ARTICLE BODY:\n` +
    `------------------------------\n` +
    `${article.body}\n` +
    `------------------------------\n\n` +
    `Return the revised article body inside a \`\`\`mdx fenced block.`
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function loadArticle(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    filePath,
    slug,
    frontmatter: parsed.data,
    body: parsed.content,
    rawFrontmatter: raw.slice(0, raw.indexOf("---", 3) + 3),
  };
}

function loadAuditReport(slug) {
  const filePath = path.join(AUDIT_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listCandidates(action) {
  if (!fs.existsSync(AUDIT_DIR)) return [];
  return fs
    .readdirSync(AUDIT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "SUMMARY.json")
    .map((f) => {
      const report = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, f), "utf8"));
      return report;
    })
    .filter((r) => r.recommendedAction === action)
    .map((r) => r.slug);
}

function extractMdxBody(text) {
  const fenced = text.match(/```mdx\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();
  const generic = text.match(/```\s*([\s\S]+?)```/);
  if (generic) return generic[1].trim();
  return text.trim();
}

function writeArticle(article, newBody) {
  const raw = fs.readFileSync(article.filePath, "utf8");
  const closingIdx = raw.indexOf("\n---", 3) + 4;
  const frontmatterBlock = raw.slice(0, closingIdx);
  const updated = frontmatterBlock + "\n" + newBody + "\n";
  fs.writeFileSync(article.filePath, updated, "utf8");
}

// ─── FIX ONE ARTICLE ─────────────────────────────────────────────────────────

async function fixOne(client, slug) {
  const article = loadArticle(slug);
  if (!article) {
    console.log(`  SKIP: article file not found for ${slug}`);
    return null;
  }

  const report = loadAuditReport(slug);
  if (!report) {
    console.log(`  SKIP: no audit report for ${slug}`);
    return null;
  }

  if (dryRun) {
    console.log(`  DRY RUN: would fix ${slug} (${report.recommendedAction})`);
    return { slug, status: "dry-run" };
  }

  console.log(`  Fixing ${slug}...`);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(article, report) }],
  });

  const rawText = message.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const newBody = extractMdxBody(rawText);

  if (!newBody || newBody.length < 200) {
    console.log(`  ERROR: model returned too-short body for ${slug}`);
    return { slug, status: "error", reason: "short response" };
  }

  writeArticle(article, newBody);

  if (!fs.existsSync(FIX_REPORTS_DIR)) fs.mkdirSync(FIX_REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(FIX_REPORTS_DIR, `${slug}.json`),
    JSON.stringify({ slug, fixedAt: new Date().toISOString(), claimsFixed: (report.claims || []).filter((c) => c.status !== "VERIFIED").length }, null, 2),
    "utf8",
  );

  console.log(`  Fixed: ${slug}`);
  return { slug, status: "fixed" };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is required. Set it in .env.local.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  let slugs;
  if (onlySlug) {
    slugs = [onlySlug];
  } else {
    slugs = listCandidates(action);
    if (action === "REVISE" && args.includes("--action=REVISE")) {
      // Also include REVISE when explicitly requested.
    }
  }

  if (limit) slugs = slugs.slice(0, limit);

  if (slugs.length === 0) {
    console.log(`No articles with recommendedAction=${action} found in audit-reports/.`);
    return;
  }

  console.log(`Fixing ${slugs.length} articles (action=${action})...`);
  if (dryRun) console.log("DRY RUN — no files will be modified.");

  for (let i = 0; i < slugs.length; i += concurrency) {
    const batch = slugs.slice(i, i + concurrency);
    await Promise.all(batch.map((slug) => fixOne(client, slug)));
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
