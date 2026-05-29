// scripts/audit-accuracy-claude.mjs
//
// Search-grounded accuracy audit for BuildGuiders consumer electronics articles.
// Uses Claude with web_search to verify claims against current manufacturer
// documentation and reputable AV sources (RTINGS, AVSForum, official specs).
//
// USAGE:
//   node scripts/audit-accuracy-claude.mjs                  # audit every article
//   node scripts/audit-accuracy-claude.mjs --slug=foo       # one article
//   node scripts/audit-accuracy-claude.mjs --limit=10       # first N
//   node scripts/audit-accuracy-claude.mjs --published-only
//   node scripts/audit-accuracy-claude.mjs --concurrency=3
//   node scripts/audit-accuracy-claude.mjs --dry-run
//
// ENV:
//   ANTHROPIC_API_KEY (required)
//   AUDIT_MODEL (default: claude-opus-4-7)
//
// OUTPUT:
//   audit-reports/<slug>.json    — per-article structured report
//   audit-reports/SUMMARY.md     — ranked list of articles by issue count
//   audit-reports/SUMMARY.json   — same data in JSON

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env", override: false });

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const REPORTS_DIR = path.join(ROOT, "audit-reports");
const MODEL = process.env.AUDIT_MODEL || "claude-opus-4-7";

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
const slugList =
  typeof flags.slugs === "string"
    ? new Set(flags.slugs.split(",").map((s) => s.trim()).filter(Boolean))
    : null;
const limit = flags.limit ? Number(flags.limit) : null;
const publishedOnly = Boolean(flags["published-only"]);
const concurrency = flags.concurrency ? Number(flags.concurrency) : 3;
const dryRun = Boolean(flags["dry-run"]);
const failedOnly = Boolean(flags["failed-only"]);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function listArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(ARTICLES_DIR, f));
}

function loadArticle(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    filePath,
    slug: parsed.data.slug || path.basename(filePath, ".mdx"),
    frontmatter: parsed.data,
    body: parsed.content.trim(),
  };
}

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a fact-checker for consumer electronics troubleshooting content covering TVs, AV receivers, soundbars, streaming devices, HDMI connections, and gaming consoles. Your job is to verify the factual claims in a single article against current manufacturer documentation, official spec sheets, and reputable AV trade sources (RTINGS.com, AVSForum, HDMI Forum, manufacturer product pages). Use web_search and web_fetch liberally — your verdicts must be grounded in real, current sources, not training data alone.

What to verify (in priority order):

1. FORMAT SUPPORT CLAIMS — brand-specific format support is the #1 error source:
   - Samsung TVs do NOT support Dolby Vision (uses HDR10+ instead). Any claim that Samsung supports Dolby Vision is CRITICAL.
   - Optical/TOSLINK CANNOT carry Dolby Atmos, DTS:X, or lossless audio. It only supports Dolby Digital compressed (up to 5.1) or stereo PCM.
   - ARC (standard) only carries compressed Dolby Digital/DTS. eARC is required for Dolby TrueHD, DTS-HD MA, and object-based Atmos/DTS:X lossless.
   - Apple TV 4K (Gen 3) does NOT output 4K@120Hz even though it has an HDMI 2.1 port (Apple disabled it in tvOS).

2. HDMI VERSION vs CLAIMED FEATURE:
   - HDMI 2.0 maxes at 4K@60Hz (18 Gbps). Any claim of HDMI 2.0 + 4K@120Hz is CRITICAL.
   - HDMI 2.1 is required for 4K@120Hz, 8K@60Hz, VRR, ALLM, and eARC.
   - "HDMI 2.1 cable" or "HDMI 2.0 cable" is technically wrong — cables have speed ratings not version numbers. Correct: "Certified Ultra High Speed" (48Gbps) or "Certified Premium High Speed" (18Gbps).

3. DEVICE RESOLUTION CAPS:
   - Nintendo Switch: 1080p docked, 720p handheld. NO 4K support at all. Any 4K claim for Switch is CRITICAL.
   - Fire TV Stick Lite: 1080p ONLY. NOT 4K capable. CRITICAL if 4K is claimed.
   - Xbox Series S: 1440p game rendering max (NOT 4K gaming). Streaming apps run at 4K. "4K@120Hz" for games on Series S is CRITICAL.

4. PORT-LEVEL SPECIFICATIONS — HDMI ports differ within the same TV:
   - Many TVs only have 1-2 HDMI 2.1 ports, with the others being HDMI 2.0. Verify which specific port supports eARC, 4K@120, VRR, etc.
   - Samsung: typically HDMI 4 = eARC; LG: typically HDMI 2 = eARC; Sony: typically HDMI 3 = eARC. Verify per model.

5. ECOSYSTEM / BRAND NAMES:
   - CEC names: Samsung = Anynet+, LG = SimpLink, Sony = Bravia Sync, Vizio = CEC (no brand name).
   - Multi-room: Denon/Marantz = HEOS, Yamaha = MusicCast, Onkyo = Chromecast Built-in.
   - Sonos uses WiFi for music playback (not Bluetooth).

6. DEVICE-SPECIFIC SPECS — verify per named model:
   - Channel configuration, power ratings, Atmos/DTS:X support for AV receivers.
   - Which streaming apps are available on which platforms.
   - Gaming console storage, controller specs, backward compatibility claims.

7. TROUBLESHOOTING PROCEDURES — verify steps are accurate for the named device/model.

8. INTERNAL CONSISTENCY — flag any place where two parts of the same article contradict each other.

For each substantive factual claim, classify as:
- VERIFIED: matches documentation. Cite the source URL.
- CONTRADICTED: provably wrong. Cite the correct fact AND a source URL.
- UNVERIFIABLE: cannot find a primary source either way.
- INTERNAL_CONTRADICTION: conflicts with another claim in the same article.

Severity for non-VERIFIED claims:
- CRITICAL: actively wrong advice (wrong format support, wrong resolution cap, wrong safety/compatibility claim) that will mislead users.
- HIGH: wrong specific advice that won't fix the user's problem.
- MEDIUM: wrong but the user's overall path will still work.
- LOW: minor inaccuracy or imprecision that doesn't affect outcomes.

Skip:
- Boilerplate like "consult the manual" or "contact support"
- Generic troubleshooting steps with no specific factual content
- The affiliate link block at the end of articles
- UI navigation paths (menus change with firmware updates — flag only if clearly wrong)

Output format: Return ONLY a single JSON object inside a \`\`\`json fenced code block with this exact shape:

\`\`\`json
{
  "slug": "<article slug>",
  "overallScore": 0,
  "summary": "1-2 sentence overall verdict",
  "recommendedAction": "PUBLISH" | "REVISE" | "UNPUBLISH",
  "criticalCount": 0,
  "highCount": 0,
  "mediumCount": 0,
  "lowCount": 0,
  "internalContradictions": 0,
  "claims": [
    {
      "claim": "exact short quote from article",
      "section": "section heading",
      "status": "VERIFIED|CONTRADICTED|UNVERIFIABLE|INTERNAL_CONTRADICTION",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|N/A",
      "correctFact": "the correct fact if CONTRADICTED (otherwise null)",
      "source": "URL or source reference (otherwise null)"
    }
  ]
}
\`\`\`

overallScore: 100 = no errors. Subtract 25 per CRITICAL, 10 per HIGH, 4 per MEDIUM, 1 per LOW, 15 per INTERNAL_CONTRADICTION. Floor at 0.

recommendedAction:
- PUBLISH: 0 CRITICAL, 0 INTERNAL_CONTRADICTION, ≤1 HIGH.
- REVISE: 0 CRITICAL but fixable errors exist.
- UNPUBLISH: any CRITICAL exists.`;

function buildUserPrompt(article) {
  const fm = article.frontmatter;
  return (
    `ARTICLE TO AUDIT\n\n` +
    `Title: ${fm.title || article.slug}\n` +
    `Slug: ${article.slug}\n` +
    `Brand: ${fm.brand || "unspecified"}\n` +
    `Category: ${fm.category || "unspecified"}\n` +
    `Date: ${fm.date || "unspecified"}\n\n` +
    `BODY:\n` +
    `------------------------------\n` +
    `${article.body}\n` +
    `------------------------------\n\n` +
    `Audit this article. Use web_search to verify factual claims against current manufacturer documentation. ` +
    `Return your report as JSON inside a \`\`\`json fenced block, exactly per the schema in your instructions.`
  );
}

// ─── JSON EXTRACTION ─────────────────────────────────────────────────────────

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]+?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const generic = text.match(/```\s*([\s\S]+?)```/);
  if (generic) {
    try { return JSON.parse(generic[1]); } catch {}
  }
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

// ─── AUDIT A SINGLE ARTICLE ──────────────────────────────────────────────────

async function auditArticle(client, article) {
  if (dryRun) {
    return {
      slug: article.slug,
      overallScore: 100,
      summary: "(dry run — no audit performed)",
      recommendedAction: "PUBLISH",
      criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, internalContradictions: 0,
      claims: [],
      _meta: { dryRun: true },
    };
  }

  const messages = [{ role: "user", content: buildUserPrompt(article) }];
  const PER_ITER_TIMEOUT_MS = 8 * 60 * 1000;
  let response;
  let iterations = 0;
  const MAX_ITERATIONS = 4;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const controller = new AbortController();
    const watchdog = setTimeout(() => controller.abort(), PER_ITER_TIMEOUT_MS);

    try {
      const stream = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 16000,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          tools: [
            { type: "web_search_20260209", name: "web_search" },
            { type: "web_fetch_20260209", name: "web_fetch" },
          ],
          messages,
        },
        { signal: controller.signal },
      );
      response = await stream.finalMessage();
    } catch (err) {
      clearTimeout(watchdog);
      if (err.name === "AbortError") return errorReport(article, "wall-clock timeout");
      if (err instanceof Anthropic.RateLimitError) return errorReport(article, `rate-limited: ${err.message}`);
      if (err instanceof Anthropic.APIError) return errorReport(article, `API error ${err.status}: ${err.message}`);
      return errorReport(article, `stream error: ${err.message}`);
    } finally {
      clearTimeout(watchdog);
    }

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    break;
  }

  if (!response) return errorReport(article, "no response after retries");

  const textBlocks = response.content.filter((b) => b.type === "text");
  const finalText = textBlocks.map((b) => b.text).join("\n").trim();
  const parsed = extractJson(finalText);

  if (!parsed) {
    return {
      slug: article.slug,
      overallScore: null,
      summary: "Audit failed: could not parse model output as JSON.",
      recommendedAction: "REVISE",
      criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, internalContradictions: 0,
      claims: [],
      _meta: { error: "parse-fail", rawSnippet: finalText.slice(0, 600) },
    };
  }

  parsed._meta = {
    auditedAt: new Date().toISOString(),
    model: MODEL,
    stopReason: response.stop_reason,
    iterations,
    usage: response.usage,
  };
  return parsed;
}

function errorReport(article, message) {
  return {
    slug: article.slug,
    overallScore: null,
    summary: `Audit failed: ${message}`,
    recommendedAction: "REVISE",
    criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, internalContradictions: 0,
    claims: [],
    _meta: { error: message },
  };
}

// ─── CONCURRENCY POOL ────────────────────────────────────────────────────────

async function runPool(items, worker, max) {
  const results = new Array(items.length);
  let next = 0;
  async function loop() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, loop));
  return results;
}

// ─── REPORT WRITERS ──────────────────────────────────────────────────────────

function writePerArticleReport(report) {
  const file = path.join(REPORTS_DIR, `${report.slug}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
}

function writeSummary(reports) {
  const sorted = [...reports].sort((a, b) => {
    const sa = typeof a.overallScore === "number" ? a.overallScore : -1;
    const sb = typeof b.overallScore === "number" ? b.overallScore : -1;
    return sa - sb;
  });

  const md = [
    "# Accuracy Audit Summary — BuildGuiders",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Articles: ${reports.length}`,
    `UNPUBLISH: ${reports.filter((r) => r.recommendedAction === "UNPUBLISH").length}`,
    `REVISE: ${reports.filter((r) => r.recommendedAction === "REVISE").length}`,
    `PUBLISH: ${reports.filter((r) => r.recommendedAction === "PUBLISH").length}`,
    "",
    "## Articles (worst first)",
    "",
    ...sorted.map(
      (r) =>
        `- **${r.slug}** — score: ${r.overallScore ?? "N/A"} · ${r.recommendedAction} · C:${r.criticalCount || 0} H:${r.highCount || 0} — ${r.summary || ""}`,
    ),
  ].join("\n");

  fs.writeFileSync(path.join(REPORTS_DIR, "SUMMARY.md"), md, "utf8");
  fs.writeFileSync(
    path.join(REPORTS_DIR, "SUMMARY.json"),
    JSON.stringify(sorted.map((r) => ({
      slug: r.slug, score: r.overallScore, action: r.recommendedAction,
      critical: r.criticalCount, high: r.highCount, summary: r.summary,
    })), null, 2),
    "utf8",
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is required. Set it in .env.local.");
    process.exit(1);
  }

  ensureReportsDir();
  const client = new Anthropic({ apiKey });

  let filePaths = listArticles();
  let articles = filePaths.map(loadArticle);

  if (publishedOnly) articles = articles.filter((a) => a.frontmatter.published !== false);
  if (onlySlug) articles = articles.filter((a) => a.slug === onlySlug);
  if (slugList) articles = articles.filter((a) => slugList.has(a.slug));
  if (failedOnly) {
    articles = articles.filter((a) => {
      const reportPath = path.join(REPORTS_DIR, `${a.slug}.json`);
      if (!fs.existsSync(reportPath)) return true;
      const existing = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      return Boolean(existing._meta?.error);
    });
  }
  if (limit) articles = articles.slice(0, limit);

  if (articles.length === 0) {
    console.log("No articles to audit.");
    return;
  }

  console.log(`Auditing ${articles.length} articles with ${MODEL}...`);
  if (dryRun) console.log("DRY RUN — no API calls will be made.");

  let done = 0;
  const reports = await runPool(
    articles,
    async (article) => {
      const report = await auditArticle(client, article);
      writePerArticleReport(report);
      done++;
      console.log(
        `[${done}/${articles.length}] ${article.slug}: ${report.recommendedAction} ` +
          `(score: ${report.overallScore ?? "N/A"}, C:${report.criticalCount || 0} H:${report.highCount || 0})`,
      );
      return report;
    },
    concurrency,
  );

  writeSummary(reports);
  console.log(`\nSummary written to ${REPORTS_DIR}/SUMMARY.md`);

  const unpublish = reports.filter((r) => r.recommendedAction === "UNPUBLISH").length;
  const revise = reports.filter((r) => r.recommendedAction === "REVISE").length;
  console.log(`\nResult: UNPUBLISH: ${unpublish}  REVISE: ${revise}  PUBLISH: ${reports.length - unpublish - revise}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
