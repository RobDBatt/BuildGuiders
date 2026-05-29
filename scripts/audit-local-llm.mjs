// scripts/audit-local-llm.mjs
//
// Audit articles using a LOCAL LLM via Ollama. Zero per-call cost after Ollama
// is installed and the model is pulled. Designed for BuildGuiders AV/streaming
// content.
//
// Tradeoffs vs scripts/audit-accuracy-claude.mjs:
//   PRO: $0/article after setup. Runs offline. No rate limits.
//   CON: No web search. The local LLM only knows what's in its training data
//        + what we inject from lib/known-models.json. Strong on structural
//        issues (ARC vs eARC, Samsung/Dolby Vision, brand mismatches);
//        weaker on model-specific firmware-gated details.
//
// Best used as a first-pass filter. Use audit-accuracy-claude.mjs for articles
// the local pass flags but can't decisively classify.
//
// SETUP:
//   1. Install Ollama: https://ollama.com/download
//   2. Pull a model:  ollama pull qwen2.5:14b-instruct-q4_K_M
//   3. Confirm it runs: curl http://localhost:11434/api/tags
//
// USAGE:
//   node scripts/audit-local-llm.mjs --slug=foo
//   node scripts/audit-local-llm.mjs --limit=5
//   node scripts/audit-local-llm.mjs --concurrency=2
//   node scripts/audit-local-llm.mjs --model=llama3.1:8b
//
// ENV:
//   OLLAMA_BASE  (default: http://localhost:11434)
//   OLLAMA_MODEL (default: qwen2.5:14b-instruct-q4_K_M)

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const REPORTS_DIR = path.join(ROOT, "audit-reports");

let MODEL_TABLE = {};
try {
  MODEL_TABLE = JSON.parse(fs.readFileSync("lib/known-models.json", "utf8"));
} catch {
  console.warn("Warning: lib/known-models.json not found. Proceeding without model ground-truth.");
}

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
const concurrency = flags.concurrency ? Number(flags.concurrency) : 1;
const model =
  (typeof flags.model === "string" && flags.model) ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5:14b-instruct-q4_K_M";
const base =
  (typeof flags.base === "string" && flags.base) ||
  process.env.OLLAMA_BASE ||
  "http://localhost:11434";

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────

function buildSystemPrompt() {
  const parts = [
    "You are a fact-checker for consumer electronics (AV/streaming/gaming) troubleshooting articles. You verify claims against the GROUND TRUTH provided below. You do NOT have web access — only this lookup table and your training knowledge.",
    "",
    "CRITICAL AV ACCURACY RULES (always enforce):",
    "1. Samsung TVs do NOT support Dolby Vision. They use HDR10+ instead.",
    "2. Optical/TOSLINK connections CANNOT carry Dolby Atmos, DTS:X, or any lossless audio. Only Dolby Digital 5.1 compressed or stereo PCM.",
    "3. HDMI 2.0 maxes at 4K@60Hz. 4K@120Hz requires HDMI 2.1 (48 Gbps).",
    "4. Nintendo Switch outputs 1080p max (docked) and 720p (handheld) — NEVER 4K.",
    "5. Fire TV Stick Lite is 1080p ONLY — not 4K capable.",
    "6. Xbox Series S renders games at 1440p max — not 4K gaming.",
    "7. ARC (standard) carries only compressed audio (Dolby Digital, DTS up to 5.1). eARC is required for lossless TrueHD/Atmos/DTS-HD MA.",
    "8. Cables do NOT have HDMI version numbers. Correct terms: Certified Ultra High Speed (48Gbps), Certified Premium High Speed (18Gbps), High Speed (10.2Gbps).",
    "9. CEC brand names: Samsung=Anynet+, LG=SimpLink, Sony=Bravia Sync.",
    "10. Multi-room: Denon/Marantz use HEOS, Yamaha uses MusicCast, Onkyo uses Chromecast Built-in.",
    "",
  ];

  // Inject model lookup data from known-models.json.
  const globalRules = MODEL_TABLE.globalRules;
  if (globalRules) {
    parts.push("HDMI VERSION CAPABILITY REFERENCE:");
    for (const [ver, cap] of Object.entries(globalRules.hdmiVersionCapabilities || {})) {
      parts.push(`  HDMI ${ver}: ${cap}`);
    }
    parts.push("");
    parts.push("eARC vs ARC:");
    if (globalRules.earcVsArc) {
      parts.push(`  ARC: ${globalRules.earcVsArc.ARC}`);
      parts.push(`  eARC: ${globalRules.earcVsArc.eARC}`);
    }
    parts.push("");
  }

  // Inject summary of TV models.
  if (MODEL_TABLE.tvs) {
    parts.push("KNOWN TV MODELS (abbreviated):");
    for (const [key, tv] of Object.entries(MODEL_TABLE.tvs)) {
      parts.push(
        `  ${key} (${tv.brand}): ${tv.hdmiVersion || "?"}, HDR: ${(tv.hdrFormats || []).join(", ")}, eARC port: ${tv.earcPort || "?"}`
      );
    }
    parts.push("");
  }

  // Inject summary of streamers.
  if (MODEL_TABLE.streamers) {
    parts.push("KNOWN STREAMING DEVICES:");
    for (const [key, dev] of Object.entries(MODEL_TABLE.streamers)) {
      const resolutions = (dev.supportedResolutions || []).join(", ");
      const hdr = (dev.hdrFormats || []).join(", ");
      const doesNot = (dev.doesNotSupport || []).join(", ");
      parts.push(`  ${key} (${dev.brand}): ${resolutions}; HDR: ${hdr}${doesNot ? `; DOES NOT: ${doesNot}` : ""}`);
    }
    parts.push("");
  }

  // Inject gaming console data.
  if (MODEL_TABLE.consoles) {
    parts.push("GAMING CONSOLES:");
    for (const [key, dev] of Object.entries(MODEL_TABLE.consoles)) {
      const resolutions = (dev.supportedResolutions || []).join(", ");
      parts.push(`  ${key} (${dev.brand}): ${resolutions}`);
    }
    parts.push("");
  }

  parts.push(
    "OUTPUT FORMAT: Return ONLY a single JSON object inside a ```json fenced code block with this shape:",
    "```json",
    '{',
    '  "slug": "<slug>",',
    '  "overallScore": 0,',
    '  "summary": "1-2 sentence verdict",',
    '  "recommendedAction": "PUBLISH" | "REVISE" | "UNPUBLISH",',
    '  "criticalCount": 0,',
    '  "highCount": 0,',
    '  "mediumCount": 0,',
    '  "lowCount": 0,',
    '  "claims": [',
    '    {',
    '      "claim": "exact quote from article",',
    '      "section": "section heading",',
    '      "status": "VERIFIED" | "CONTRADICTED" | "UNVERIFIABLE" | "INTERNAL_CONTRADICTION",',
    '      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",',
    '      "correctFact": "what the fact should be (for CONTRADICTED)",',
    '      "source": "URL or description of source"',
    '    }',
    '  ]',
    '}',
    "```"
  );

  return parts.join("\n");
}

// ─── ARTICLE HELPERS ─────────────────────────────────────────────────────────

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

// ─── OLLAMA CALL ──────────────────────────────────────────────────────────────

async function auditWithOllama(article, systemPrompt) {
  const userPrompt =
    `ARTICLE SLUG: ${article.slug}\n` +
    `BRAND: ${article.frontmatter.brand || "unspecified"}\n` +
    `TITLE: ${article.frontmatter.title || article.slug}\n\n` +
    `ARTICLE BODY:\n${article.body}\n\n` +
    `Fact-check this article against the AV accuracy rules and ground truth above. Return the JSON report.`;

  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.message?.content || "";

  // Extract JSON from fenced code block.
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    throw new Error(`No JSON code block in response. Got: ${text.slice(0, 300)}`);
  }
  return JSON.parse(jsonMatch[1]);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function run() {
  ensureReportsDir();

  let filePaths = listArticles();
  let articles = filePaths.map(loadArticle);

  if (onlySlug) articles = articles.filter((a) => a.slug === onlySlug);
  if (slugList) articles = articles.filter((a) => slugList.has(a.slug));
  articles = articles.filter((a) => a.frontmatter.published !== false);
  if (limit) articles = articles.slice(0, limit);

  if (articles.length === 0) {
    console.log("No articles to audit.");
    return;
  }

  console.log(`Auditing ${articles.length} articles with ${model} via Ollama...`);

  const systemPrompt = buildSystemPrompt();
  let done = 0;
  let criticalTotal = 0;
  let highTotal = 0;

  async function auditOne(article) {
    try {
      const report = await auditWithOllama(article, systemPrompt);
      report.slug = article.slug; // ensure slug is set
      const outPath = path.join(REPORTS_DIR, `${article.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
      done++;
      criticalTotal += report.criticalCount || 0;
      highTotal += report.highCount || 0;
      console.log(
        `[${done}/${articles.length}] ${article.slug}: ${report.recommendedAction} ` +
          `(C:${report.criticalCount || 0} H:${report.highCount || 0})`
      );
    } catch (err) {
      console.error(`ERROR auditing ${article.slug}: ${err.message}`);
    }
  }

  // Run with limited concurrency.
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    await Promise.all(batch.map(auditOne));
  }

  console.log(`\nDone. CRITICAL: ${criticalTotal} HIGH: ${highTotal}`);
  console.log(`Reports written to ${REPORTS_DIR}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
