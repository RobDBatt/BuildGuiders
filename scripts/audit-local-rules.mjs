// scripts/audit-local-rules.mjs
//
// Deterministic article auditor for BuildGuiders (AV/streaming/gaming domain).
// Zero LLM calls, zero API cost. Validates articles against lib/known-models.json.
// Catches the most common mistake patterns for consumer electronics content:
//
//   1. Brand-banned format claims (Samsung + Dolby Vision, optical + Atmos)
//   2. HDMI version vs claimed feature (HDMI 2.0 + 4K@120, "HDMI 2.1 cable")
//   3. Device resolution cap violations (Switch + 4K, Fire TV Stick Lite + 4K)
//   4. Cross-brand model confusion (Samsung model cited in LG article)
//   5. ARC vs eARC capability confusion
//   6. Wrong CEC brand-name (e.g., "Anynet+" in an LG article)
//   7. Wrong multi-room ecosystem (HEOS attributed to Yamaha)
//   8. Xbox Series S + 4K gaming
//   9. Internal contradictions (adjacent claims that disagree)
//
// USAGE:
//   node scripts/audit-local-rules.mjs                     # all articles
//   node scripts/audit-local-rules.mjs --slug=foo
//   node scripts/audit-local-rules.mjs --quiet             # only show findings
//   node scripts/audit-local-rules.mjs --out=reports/local-rules.md

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

let MODELS = {};
try {
  MODELS = JSON.parse(fs.readFileSync("lib/known-models.json", "utf8"));
} catch {
  // known-models.json is optional for this script to run; checks relying on
  // it will simply have no specific model data to cross-reference.
}

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
const quiet = Boolean(flags.quiet);
const outFile = typeof flags.out === "string" ? flags.out : null;

// ─── NEGATION DETECTOR ───────────────────────────────────────────────────────
// Suppress findings when the surrounding context is explicitly negating the
// claim (teaching the right answer vs incorrectly asserting it).

function isNegatingContext(window) {
  return (
    // Direct negations
    /\b(?:does\s*n[o']t|do\s*n[o']t|is\s*n[o']t|are\s*n[o']t|was\s*n[o']t|were\s*n[o']t|won[o']t|\*\*not\*\*|does\s+NOT|does\s+not\s+support|doesn't\s+support|cannot|can't\s+carry|can't\s+(?:do|handle|pass|support)|not\s+support(?:ed)?|no\s+support\s+for|instead\s+of|only\s+support|contrary\s+to|common\s+myth|misconception|in\s+fact|rather\s+than|whereas|without\s+.{0,30}support)\b/i.test(
      window,
    ) ||
    // Teaching the correct alternative
    /\b(?:require[sd]?|needs?|needed)\s+(?:e|E)ARC\b/.test(window) ||
    /\b(?:e|E)ARC\s+(?:is\s+)?(?:required|needed|necessary)\b/.test(window) ||
    /\bonly\s+(?:need|require)s?\s+(?:e|E)ARC\b/.test(window) ||
    /\bHDMI\s+2\.1\s+(?:is\s+)?(?:required|needed|necessary)\b/i.test(window) ||
    /\buse[sd]?\s+[A-Z][A-Za-z0-9+]*\s+instead\b/i.test(window) ||
    // "caps at", "maxes at", "limited to", "up to X only"
    /\b(?:caps?|maxes?|tops?)\s+(?:at|out)\b/i.test(window) ||
    /\blimited\s+to\b/i.test(window) ||
    /\bup\s+to\s+[^.]*\s+only\b/i.test(window) ||
    // "notable omission", "No X" as an explicit callout
    /\bnotable\s+omission\b/i.test(window) ||
    /(?:^|[\n,;(]|\s[-*•]\s*|\*\*)\s*No\s+(?:Dolby\s+Vision|Dolby\s+Atmos|Atmos|4K|HDMI|eARC)\b/i.test(
      window,
    ) ||
    // "without eARC", "no eARC" — explicit acknowledgement that eARC isn't present
    /\b(?:without|no)\s+eARC\b/i.test(window) ||
    // "not chasing/using/needing X" — article is saying user doesn't need X
    /\bnot\s+(?:chasing|using|needing|wanting|pursuing|after|going\s+for)\b/i.test(window) ||
    // "lose Dolby Atmos", "lose TrueHD" — teaching what you give up
    /\blose\s+(?:Dolby|Atmos|TrueHD|lossless|DTS)\b/i.test(window) ||
    // Lossy explanation — article is teaching that the format is compressed
    /\blossy\b/i.test(window) ||
    /\bcompressed\s+(?:Dolby|audio|format)/i.test(window) ||
    // "lose 120Hz gaming" — teaching what you give up
    /\blose\s+(?:\d+Hz|4K|120Hz|gaming|VRR|ALLM)\b/i.test(window) ||
    /\bwon[o']t\s+pass\b/i.test(window)
  );
}

// ─── CHECK 1: BRAND-BANNED FORMAT CLAIMS ─────────────────────────────────────

const BRAND_FORMAT_BANS = [
  {
    brand: "samsung",
    bannedPhrase: /dolby\s+vision/i,
    severity: "CRITICAL",
    type: "SAMSUNG_DOLBY_VISION",
    message:
      "Article claims Samsung supports Dolby Vision. Samsung does NOT support Dolby Vision — they use HDR10+ instead. This is a deliberate business decision, not a bug.",
    fix: "Replace Dolby Vision references with HDR10+. Samsung TVs support HDR10, HDR10+, and HLG — not Dolby Vision.",
  },
];

function checkBrandFormatBans(article, body) {
  const findings = [];
  const articleBrand = (article.frontmatter.brand || "").toLowerCase().trim();
  if (!articleBrand) return findings;

  for (const rule of BRAND_FORMAT_BANS) {
    if (!articleBrand.includes(rule.brand)) continue;
    const matches = [...body.matchAll(new RegExp(rule.bannedPhrase.source, "gi"))];
    for (const m of matches) {
      const win = body.slice(Math.max(0, m.index - 150), m.index + 150);
      if (isNegatingContext(win)) continue;
      // Require the article's brand to appear in the same window — otherwise
      // the banned phrase may be discussing a competitor/alternative brand
      // (e.g., a Samsung article saying "choose LG if Dolby Vision matters").
      if (!new RegExp(`\\b${rule.brand}\\b`, "i").test(win)) continue;
      findings.push({
        severity: rule.severity,
        type: rule.type,
        message: rule.message,
        context: win.trim(),
        fix: rule.fix,
      });
      break; // one finding per rule per article is enough
    }
  }
  return findings;
}

// ─── CHECK 2: OPTICAL / TOSLINK + ATMOS ──────────────────────────────────────

function checkOpticalAtmos(article, body) {
  const findings = [];
  // Look for optical/TOSLINK being claimed to carry Atmos or DTS:X.
  const opticalRe = /\b(?:optical|toslink|s\/pdif)\b/gi;
  const atmosRe = /\b(?:dolby\s+atmos|dts:?x|lossless)\b/gi;
  // If eARC appears in the window, the article is almost always teaching
  // the distinction (eARC=Atmos, optical=compressed) rather than claiming
  // optical carries Atmos.
  const earcInWindowRe = /\beARC\b/;

  const opticalMatches = [...body.matchAll(opticalRe)];
  for (const m of opticalMatches) {
    // Look ahead 250 chars, but truncate at the first paragraph break —
    // a claim in a separate paragraph is not a claim about optical.
    let ahead = body.slice(m.index, m.index + 250);
    const paragraphBreak = ahead.indexOf("\n\n");
    if (paragraphBreak !== -1) ahead = ahead.slice(0, paragraphBreak);
    if (earcInWindowRe.test(ahead)) continue;
    if (atmosRe.test(ahead) && !isNegatingContext(ahead)) {
      findings.push({
        severity: "CRITICAL",
        type: "OPTICAL_CANNOT_CARRY_ATMOS",
        message:
          "Article implies optical/TOSLINK can carry Dolby Atmos, DTS:X, or lossless audio. Optical connections are limited to Dolby Digital 5.1 compressed or stereo PCM — they cannot carry Atmos or object-based audio. eARC over HDMI is required.",
        context: ahead.slice(0, 200).trim(),
        fix: "Optical/TOSLINK cannot carry Atmos or DTS:X. Only eARC (HDMI) supports lossless Dolby TrueHD/Atmos and DTS-HD MA/DTS:X passthrough.",
      });
      break;
    }
  }
  return findings;
}

// ─── CHECK 3: HDMI VERSION CLAIMS ────────────────────────────────────────────

function checkHdmiVersionClaims(article, body) {
  const findings = [];

  // "HDMI 2.1 cable" or "HDMI 2.0 cable" — cables don't have version numbers.
  const hdmiCableRe = /\bhdmi\s+2\.[01][a-z]?\s+cable\b/gi;
  for (const m of body.matchAll(hdmiCableRe)) {
    const win = body.slice(Math.max(0, m.index - 100), m.index + 100);
    if (isNegatingContext(win)) continue;
    findings.push({
      severity: "HIGH",
      type: "HDMI_CABLE_VERSION_WRONG",
      message: `Article uses "${m[0]}" — cables do not have HDMI version numbers. Cables have speed ratings.`,
      context: win.trim(),
      fix: 'Use cable speed rating instead: "Certified Ultra High Speed HDMI cable" (48 Gbps, needed for 4K@120/eARC) or "Certified Premium High Speed HDMI cable" (18 Gbps, fine for 4K@60).',
    });
    break;
  }

  // HDMI 2.0 + 4K@120Hz claim (HDMI 2.0 maxes at 4K@60).
  const hdmi20Re = /\bhdmi\s+2\.0[a-z]?\b/gi;
  const res120Re = /\b4[kK][\s@x]+120\s*[Hh]z\b|\b120[Hh]z.{0,50}4[kK]\b/;
  for (const m of body.matchAll(hdmi20Re)) {
    const win = body.slice(Math.max(0, m.index - 100), m.index + 200);
    if (res120Re.test(win) && !isNegatingContext(win)) {
      findings.push({
        severity: "CRITICAL",
        type: "HDMI20_CANNOT_DO_4K120",
        message:
          "Article claims HDMI 2.0 supports 4K@120Hz. HDMI 2.0 is capped at 4K@60Hz (18 Gbps). 4K@120Hz requires HDMI 2.1 (48 Gbps).",
        context: win.trim(),
        fix: "HDMI 2.0 → max 4K@60Hz. For 4K@120Hz (gaming, VRR), HDMI 2.1 is required.",
      });
      break;
    }
  }

  return findings;
}

// ─── CHECK 4: DEVICE RESOLUTION CAP VIOLATIONS ───────────────────────────────

const DEVICE_RES_CAPS = [
  {
    // Require "nintendo" to be present — the word "switch" alone matches
    // HDMI switch articles, input-switching articles, etc.
    brands: ["nintendo"],
    slugPatterns: [/nintendo/i],
    bannedClaim: /\b(?:4[kK]|2160[pP]|8[kK])\b/,
    severity: "CRITICAL",
    type: "SWITCH_NO_4K",
    message:
      "Nintendo Switch does NOT support 4K output. Max resolution is 1080p docked and 720p in handheld mode.",
    fix: "Replace any 4K claims for Nintendo Switch with 1080p (docked) or 720p (handheld).",
  },
  {
    brands: ["fire tv stick lite", "fire tv stick lite"],
    slugPatterns: [/fire.tv.stick.lite/i, /firestick.lite/i],
    bannedClaim: /\b(?:4[kK]|2160[pP])\b/,
    severity: "CRITICAL",
    type: "FIRE_TV_STICK_LITE_NO_4K",
    message:
      "Fire TV Stick Lite is 1080p ONLY — it does not support 4K output. The 4K-capable model is the Fire TV Stick 4K or 4K Max.",
    fix: "Change 4K references to 1080p for Fire TV Stick Lite. If the article is about 4K, the correct product is the Fire TV Stick 4K or 4K Max.",
  },
  {
    brands: ["xbox series s"],
    slugPatterns: [/xbox.series.s\b/i, /series[\-\s]s\b/i],
    bannedClaim: /\b4[kK][\s@]+120\s*[Hh]z\b|\b4[kK]\s+gaming\b/,
    severity: "CRITICAL",
    type: "XBOX_SERIES_S_NO_4K_GAMING",
    message:
      "Xbox Series S renders games at 1440p max. It does NOT support 4K@120Hz for games. (4K is available for streaming apps like Netflix and via upscaling, but not native game rendering.)",
    fix: "Xbox Series S → 1440p gaming, not 4K gaming. Never write '4K@120Hz' or '4K gaming' for Series S.",
  },
];

function checkDeviceResCaps(article, body) {
  const findings = [];
  const titleSlug = `${article.frontmatter.brand || ""} ${article.frontmatter.title || ""} ${article.slug}`.toLowerCase();

  for (const rule of DEVICE_RES_CAPS) {
    const slugMatches = rule.slugPatterns.some((re) => re.test(titleSlug));
    const brandMatches = rule.brands.some((b) => titleSlug.includes(b));
    if (!slugMatches && !brandMatches) continue;

    const matches = [...body.matchAll(new RegExp(rule.bannedClaim.source, "gi"))];
    for (const m of matches) {
      const win = body.slice(Math.max(0, m.index - 150), m.index + 150);
      if (isNegatingContext(win)) continue;
      findings.push({
        severity: rule.severity,
        type: rule.type,
        message: rule.message,
        context: win.trim(),
        fix: rule.fix,
      });
      break;
    }
  }
  return findings;
}

// ─── CHECK 5: ARC vs eARC CONFUSION ──────────────────────────────────────────

function checkArcEarcConfusion(article, body) {
  const findings = [];

  // ARC + lossless / TrueHD / Atmos (not eARC)
  const arcRe = /\b(?<!e)ARC\b(?!\s*[–—-]?\s*eARC|\s+and\s+eARC)/g;
  const losslessRe = /\b(?:dolby\s+truehd|lossless\s+(?:atmos|audio)|dts.hd\s+ma|full.?lossless)\b/i;
  // If eARC is mentioned in the same window, the article is almost always
  // teaching the distinction — not claiming ARC carries lossless.
  const earcInWindowRe = /\beARC\b/;

  for (const m of body.matchAll(arcRe)) {
    const win = body.slice(Math.max(0, m.index - 80), m.index + 200);
    if (earcInWindowRe.test(win)) continue;
    if (losslessRe.test(win) && !isNegatingContext(win)) {
      findings.push({
        severity: "HIGH",
        type: "ARC_CANNOT_CARRY_LOSSLESS",
        message:
          "Article implies ARC (not eARC) can carry lossless audio (TrueHD, Atmos, DTS-HD MA). Standard ARC is limited to compressed Dolby Digital (5.1) or DTS. Lossless requires eARC.",
        context: win.slice(0, 200).trim(),
        fix: "ARC → compressed Dolby Digital/DTS only. eARC (Enhanced Audio Return Channel) → lossless TrueHD, Dolby Atmos, DTS-HD MA, DTS:X.",
      });
      break;
    }
  }
  return findings;
}

// ─── CHECK 6: WRONG CEC BRAND NAMES ──────────────────────────────────────────

const CEC_BRAND_NAMES = {
  samsung: { correct: "Anynet+", wrong: ["simplink", "bravia sync", "inlink", "cec control"] },
  lg: { correct: "SimpLink", wrong: ["anynet+", "bravia sync", "inlink"] },
  sony: { correct: "Bravia Sync", wrong: ["anynet+", "simplink", "inlink"] },
  vizio: { correct: "CEC", wrong: ["anynet+", "simplink", "bravia sync", "inlink"] },
};

function checkCecBrandNames(article, body) {
  const findings = [];
  const articleBrand = (article.frontmatter.brand || "").toLowerCase().trim();
  const rule = CEC_BRAND_NAMES[articleBrand];
  if (!rule) return findings;

  const lower = body.toLowerCase();
  for (const wrongName of rule.wrong) {
    const idx = lower.indexOf(wrongName);
    if (idx !== -1) {
      const win = body.slice(Math.max(0, idx - 100), idx + 150);
      if (isNegatingContext(win)) continue;
      findings.push({
        severity: "HIGH",
        type: "WRONG_CEC_BRAND_NAME",
        message: `Article uses "${wrongName}" as the CEC name for ${article.frontmatter.brand}, but the correct brand-specific CEC name is "${rule.correct}".`,
        context: win.trim(),
        fix: `${article.frontmatter.brand} calls their HDMI-CEC implementation "${rule.correct}". Replace "${wrongName}" with "${rule.correct}".`,
      });
      break;
    }
  }
  return findings;
}

// ─── CHECK 7: WRONG MULTI-ROOM ECOSYSTEM ─────────────────────────────────────

const MULTIROOM_ECOSYSTEMS = {
  denon: { correct: "HEOS", wrong: ["musiccast", "sonos connect", "chromecast built-in"] },
  marantz: { correct: "HEOS", wrong: ["musiccast", "yamaha musiccast"] },
  yamaha: { correct: "MusicCast", wrong: ["heos", "denon heos"] },
  onkyo: { correct: "Chromecast Built-in", wrong: ["heos", "musiccast"] },
};

function checkMultiroomEcosystem(article, body) {
  const findings = [];
  const articleBrand = (article.frontmatter.brand || "").toLowerCase().trim();
  const rule = MULTIROOM_ECOSYSTEMS[articleBrand];
  if (!rule) return findings;

  const lower = body.toLowerCase();
  for (const wrongName of rule.wrong) {
    const idx = lower.indexOf(wrongName);
    if (idx !== -1) {
      const win = body.slice(Math.max(0, idx - 100), idx + 150);
      if (isNegatingContext(win)) continue;
      findings.push({
        severity: "HIGH",
        type: "WRONG_MULTIROOM_ECOSYSTEM",
        message: `Article attributes "${wrongName}" multi-room ecosystem to ${article.frontmatter.brand}. ${article.frontmatter.brand} uses ${rule.correct}.`,
        context: win.trim(),
        fix: `${article.frontmatter.brand} uses ${rule.correct} for multi-room audio. Replace "${wrongName}" references.`,
      });
      break;
    }
  }
  return findings;
}

// ─── CHECK 8: CROSS-BRAND MODEL MENTIONS ─────────────────────────────────────
// Detect when a model number associated with a different brand appears in the
// body of a brand-specific article. Uses known-models.json for the model index.

function buildModelIndex() {
  const index = {};
  for (const [category, brands] of Object.entries(MODELS)) {
    if (category === "globalRules") continue;
    if (typeof brands !== "object") continue;
    for (const [modelKey, info] of Object.entries(brands)) {
      if (!info || !info.brand) continue;
      // Index by model key and by modelNumbers array if present.
      index[modelKey.toLowerCase()] = info.brand;
      if (Array.isArray(info.modelNumbers)) {
        for (const mn of info.modelNumbers) {
          index[mn.toLowerCase()] = info.brand;
        }
      }
    }
  }
  return index;
}

const MODEL_INDEX = buildModelIndex();

function checkCrossBrandModels(article, body) {
  const findings = [];
  const articleBrand = (article.frontmatter.brand || "").toLowerCase().trim();
  if (!articleBrand) return findings;
  // Multi-brand roundups and general guides legitimately mention multiple brands.
  const MULTI_BRAND_VALUES = new Set(["multi", "multiple", "various", "all", "general"]);
  if (MULTI_BRAND_VALUES.has(articleBrand)) return findings;

  // Strip markdown link URLs and import statements before scanning. Cross-link
  // targets like "/best-tv-for-xbox-series-x" legitimately contain other
  // brands' slugs and should not trigger a mismatch.
  const scanBody = body
    .replace(/\]\([^)]*\)/g, "]()")     // markdown link URLs
    .replace(/^import\s+.*$/gm, "");    // ESM import lines

  for (const [modelKey, brand] of Object.entries(MODEL_INDEX)) {
    if (brand.toLowerCase() === articleBrand) continue;
    // Only check reasonably specific model identifiers (4+ chars).
    if (modelKey.length < 4) continue;
    const re = new RegExp(`\\b${modelKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const m = scanBody.match(re);
    if (m) {
      const idx = scanBody.toLowerCase().indexOf(modelKey);
      const win = scanBody.slice(Math.max(0, idx - 80), idx + 120);
      if (isNegatingContext(win)) continue;
      findings.push({
        severity: "CRITICAL",
        type: "CROSS_BRAND_MODEL_MISMATCH",
        message: `Article (brand: ${article.frontmatter.brand}) mentions model "${modelKey}" which is a ${brand} product.`,
        context: win.trim(),
        fix: `Either change the brand in frontmatter to ${brand}, or replace the model reference with a ${article.frontmatter.brand} equivalent.`,
      });
      break; // one finding per article is enough to flag for review
    }
  }
  return findings;
}

// ─── CHECK 9: INTERNAL CONTRADICTIONS ────────────────────────────────────────

function checkInternalContradictions(body) {
  const findings = [];
  const lower = body.toLowerCase();

  // HDMI 2.1 and HDMI 2.0 claimed for same port / same feature.
  const hdmi21 = /\bhdmi\s+2\.1\b/i.test(body);
  const hdmi20 = /\bhdmi\s+2\.0\b/i.test(body);
  const onePortContext = lower.includes("all four ports") || lower.includes("all 4 ports") || lower.includes("every hdmi");
  if (hdmi21 && hdmi20 && onePortContext) {
    findings.push({
      severity: "MEDIUM",
      type: "HDMI_VERSION_CONTRADICTION",
      message:
        'Article references both HDMI 2.1 and HDMI 2.0 while also claiming "all ports" are one version. Most TVs have a mix of port versions — only specific ports support HDMI 2.1 features.',
      fix: "Specify which port number(s) support each version. Don't generalize across all ports unless verified.",
    });
  }

  // ARC and eARC claimed on same port simultaneously.
  const arcOnPort = /\bhdmi\s+(?:\d)\s+supports?\s+(?:e?arc)\b/i.test(body);
  const contradictArc =
    /hdmi\s+(\d)\s+(?:is\s+)?(?:the\s+)?(?:e?arc)\b[\s\S]{0,200}hdmi\s+\1\s+(?:is\s+)?(?:e?arc)\b/i.test(body);
  if (!arcOnPort && contradictArc) {
    findings.push({
      severity: "MEDIUM",
      type: "ARC_EARC_PORT_CONTRADICTION",
      message: "Article may be assigning both ARC and eARC to the same HDMI port number. A port is either ARC or eARC — not both (eARC supersedes ARC on that port).",
      fix: "Clarify: eARC ports are backward-compatible with ARC devices, but the port itself is labeled eARC when it supports the full enhanced spec.",
    });
  }

  return findings;
}

// ─── RUN ─────────────────────────────────────────────────────────────────────

function listArticles() {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({
      filePath: path.join(ARTICLES_DIR, f),
      slug: f.replace(/\.mdx$/, ""),
    }));
}

function loadArticle(file) {
  const raw = fs.readFileSync(file.filePath, "utf8");
  try {
    const parsed = matter(raw);
    return {
      ...file,
      frontmatter: parsed.data,
      body: parsed.content,
    };
  } catch (err) {
    if (!quiet) {
      console.warn(`  [SKIP] ${file.slug}: YAML parse error — ${err.message.split("\n")[0]}`);
    }
    return {
      ...file,
      frontmatter: {},
      body: raw,
      parseError: true,
    };
  }
}

function auditOne(article) {
  const findings = [
    ...checkBrandFormatBans(article, article.body),
    ...checkOpticalAtmos(article, article.body),
    ...checkHdmiVersionClaims(article, article.body),
    ...checkDeviceResCaps(article, article.body),
    ...checkArcEarcConfusion(article, article.body),
    ...checkCecBrandNames(article, article.body),
    ...checkMultiroomEcosystem(article, article.body),
    ...checkCrossBrandModels(article, article.body),
    ...checkInternalContradictions(article.body),
  ];
  return { ...article, findings };
}

function run() {
  let articles = listArticles().map(loadArticle);
  if (onlySlug) articles = articles.filter((a) => a.slug === onlySlug);

  // Skip unpublished articles unless explicitly requested.
  articles = articles.filter((a) => a.frontmatter.published !== false);

  const audited = articles.map(auditOne);

  // Sort by finding severity (most critical first).
  const sevWeight = { CRITICAL: 100, HIGH: 50, MEDIUM: 10, LOW: 1 };
  audited.sort((a, b) => {
    const aw = a.findings.reduce((s, f) => s + (sevWeight[f.severity] || 0), 0);
    const bw = b.findings.reduce((s, f) => s + (sevWeight[f.severity] || 0), 0);
    return bw - aw;
  });

  const totals = audited.reduce(
    (acc, a) => {
      acc.articles++;
      if (a.findings.length === 0) acc.clean++;
      for (const f of a.findings) acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    { articles: 0, clean: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
  );

  console.log(`Local-rules audit: ${totals.articles} articles, ${totals.clean} clean.`);
  console.log(`  CRITICAL: ${totals.CRITICAL}  HIGH: ${totals.HIGH}  MEDIUM: ${totals.MEDIUM}  LOW: ${totals.LOW}`);
  console.log("");

  if (!quiet) {
    for (const a of audited) {
      if (a.findings.length === 0) continue;
      console.log(`── ${a.slug} (${a.findings.length} finding${a.findings.length === 1 ? "" : "s"})`);
      for (const f of a.findings) {
        console.log(`  [${f.severity}] ${f.type}: ${f.message}`);
        if (f.fix) console.log(`     fix: ${f.fix.slice(0, 200)}`);
      }
      console.log("");
    }
  }

  if (outFile) {
    const md = renderMarkdown(audited, totals);
    const dir = path.dirname(outFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outFile, md, "utf8");
    console.log(`Wrote ${outFile}`);
  }

  // Exit code: non-zero if any CRITICAL or HIGH found.
  const failCount = totals.CRITICAL + totals.HIGH;
  process.exit(failCount > 0 ? 1 : 0);
}

function renderMarkdown(audited, totals) {
  const lines = [
    "# Local Rules Audit — BuildGuiders",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Articles audited: ${totals.articles} (${totals.clean} clean)`,
    `Findings: CRITICAL ${totals.CRITICAL} · HIGH ${totals.HIGH} · MEDIUM ${totals.MEDIUM} · LOW ${totals.LOW}`,
    "",
    "## Findings (worst articles first)",
    "",
  ];
  for (const a of audited) {
    if (a.findings.length === 0) continue;
    lines.push(`### \`${a.slug}\``);
    lines.push("");
    for (const f of a.findings) {
      lines.push(`- **[${f.severity}] ${f.type}**: ${f.message}`);
      if (f.fix) lines.push(`  - fix: ${f.fix}`);
      if (f.context) lines.push(`  - context: \`${f.context.slice(0, 200).replace(/\n/g, " ")}\``);
    }
    lines.push("");
  }
  return lines.join("\n");
}

run();
