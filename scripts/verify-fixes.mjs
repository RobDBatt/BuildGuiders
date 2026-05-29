// scripts/verify-fixes.mjs
//
// No-API-call verification of the fix-from-audit output. For each article
// whose audit report flagged CONTRADICTED claims, inspect the CURRENT MDX
// body and score whether each correction appears to have landed.
//
// Heuristic (deliberately conservative): for each contradicted claim extract
// distinctive tokens from the original claim and from the correctFact, then
// check the current body. Classify:
//   ✅ LANDED       — correctFact tokens present, original claim tokens absent
//   ⚠️  PARTIAL     — correctFact present, but claim tokens also still there
//   🚨 MISSING      — claim tokens still present, correctFact tokens absent
//   ? UNCLEAR       — neither set of tokens confidently present/absent
//
// USAGE:
//   node scripts/verify-fixes.mjs                     # verify all non-PUBLISH
//   node scripts/verify-fixes.mjs --slug=foo
//   node scripts/verify-fixes.mjs --slugs=a,b,c
//   node scripts/verify-fixes.mjs --only-fixed

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const AUDIT_DIR = path.join(ROOT, "audit-reports");

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
const onlyFixed = Boolean(flags["only-fixed"]);

// ─── Token extraction ───────────────────────────────────────────────────────

const RESOLUTION_RE = /\b\d{3,4}[pP]|\b[48][kK]\b|\b\d+[kK]@\d+[Hh]z\b|\b\d+\s*[Hh]z\b/gi;
const FORMAT_RE = /\b(?:dolby\s+(?:atmos|vision|digital|truehd)|dts[\s:]+(?:x|hd|ma)?|hdr10\+?|hlg|earc|arc)\b/gi;
const HDMI_RE = /\bhdmi\s+[\d.]+[a-z]?\b|\bcertified\s+(?:ultra|premium)\s+high\s+speed\b/gi;
const NUMERIC_RE = /\b\d+(?:\.\d+)?\s*(?:gbps|gb|tb|hz|ms|watts?|w\b|channels?|\.[\d]+)\b/gi;

function extractTokens(text) {
  if (!text) return { all: new Set(), resolutions: [], formats: [], hdmi: [], numeric: [] };
  const resolutions = [...text.matchAll(RESOLUTION_RE)].map((m) => m[0].toLowerCase());
  const formats = [...text.matchAll(FORMAT_RE)].map((m) => m[0].toLowerCase());
  const hdmi = [...text.matchAll(HDMI_RE)].map((m) => m[0].toLowerCase());
  const numeric = [...text.matchAll(NUMERIC_RE)].map((m) => m[0].toLowerCase());
  const all = new Set([...resolutions, ...formats, ...hdmi, ...numeric].map((t) => t.replace(/\s+/g, " ")));
  return { all, resolutions, formats, hdmi, numeric };
}

function presenceIn(tokens, body) {
  const lower = body.toLowerCase();
  const present = [];
  const absent = [];
  for (const t of tokens.all) {
    if (lower.includes(t)) {
      present.push(t);
    } else {
      absent.push(t);
    }
  }
  return { present, absent };
}

function classifyClaim(claim, auditClaim, body) {
  if (!body) return "UNCLEAR";
  const claimTokens = extractTokens(auditClaim.claim);
  const factTokens = extractTokens(auditClaim.correctFact);

  if (claimTokens.all.size === 0 && factTokens.all.size === 0) return "UNCLEAR";

  const claimPresence = presenceIn(claimTokens, body);
  const factPresence = presenceIn(factTokens, body);

  const claimStillThere = claimPresence.present.length > 0 && claimTokens.all.size > 0;
  const factIsIn = factPresence.present.length > 0 && factTokens.all.size > 0;

  if (factIsIn && !claimStillThere) return "LANDED";
  if (factIsIn && claimStillThere) return "PARTIAL";
  if (!factIsIn && claimStillThere) return "MISSING";
  return "UNCLEAR";
}

// ─── Article + Report loading ─────────────────────────────────────────────

function loadCurrentBody(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return parsed.content;
}

function loadReport(slug) {
  const filePath = path.join(AUDIT_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listNonPublish() {
  if (!fs.existsSync(AUDIT_DIR)) return [];
  return fs
    .readdirSync(AUDIT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "SUMMARY.json")
    .map((f) => {
      const report = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, f), "utf8"));
      return report;
    })
    .filter((r) => r.recommendedAction !== "PUBLISH")
    .map((r) => r.slug);
}

// ─── Verify one article ───────────────────────────────────────────────────

function verifyOne(slug) {
  const report = loadReport(slug);
  if (!report) {
    console.log(`  NO REPORT: ${slug}`);
    return;
  }

  const body = loadCurrentBody(slug);
  if (!body) {
    console.log(`  NO FILE: ${slug}`);
    return;
  }

  const contradicted = (report.claims || []).filter(
    (c) => c.status === "CONTRADICTED" && c.correctFact,
  );

  if (contradicted.length === 0) {
    console.log(`  OK (no contradicted claims to verify): ${slug}`);
    return;
  }

  let landed = 0, partial = 0, missing = 0, unclear = 0;

  for (const c of contradicted) {
    const result = classifyClaim(c.claim, c, body);
    if (result === "LANDED") landed++;
    else if (result === "PARTIAL") partial++;
    else if (result === "MISSING") missing++;
    else unclear++;

    if (result !== "LANDED") {
      const icon = result === "MISSING" ? "🚨" : result === "PARTIAL" ? "⚠️" : "?";
      console.log(`    ${icon} ${result}: "${c.claim.slice(0, 80)}"`);
      if (c.correctFact) console.log(`       → should be: ${c.correctFact.slice(0, 100)}`);
    }
  }

  const summary = `✅${landed} ⚠️${partial} 🚨${missing} ?${unclear}`;
  console.log(`  ${slug}: ${summary} (of ${contradicted.length} CONTRADICTED claims)`);
}

// ─── Main ────────────────────────────────────────────────────────────────

function run() {
  let slugs;

  if (onlySlug) {
    slugs = [onlySlug];
  } else if (slugList) {
    slugs = [...slugList];
  } else {
    slugs = listNonPublish();
  }

  if (slugs.length === 0) {
    console.log("No articles to verify.");
    return;
  }

  console.log(`Verifying fixes for ${slugs.length} articles...\n`);
  for (const slug of slugs) {
    verifyOne(slug);
  }
}

run();
