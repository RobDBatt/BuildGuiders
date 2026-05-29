#!/usr/bin/env node
/**
 * Product Relevance Validator
 *
 * Checks that the product(s) in each article's frontmatter are contextually
 * appropriate for the article topic (derived from the slug).
 *
 * Rationale: bulk generation previously copy-pasted an HDMI cable product into
 * every article regardless of topic — including network errors, overheating
 * fixes, controller charging guides, and firmware update articles. This
 * validator catches those mismatches before they reach production.
 *
 * Severity:
 *   ERROR  — product is clearly wrong for this article topic (blocks commit)
 *   WARN   — product is suspicious but could be edge-case valid (non-blocking)
 *
 * Exit codes:
 *   0 — all OK (or only warnings)
 *   1 — one or more errors found
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.resolve("content/articles");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True if the product name looks like an HDMI cable */
function isHdmiCable(name = "") {
  return /\bhdmi\b/i.test(name) && /\bcable\b/i.test(name);
}

/** True if the product name looks like a network/WiFi product */
function isNetworkProduct(name = "") {
  return /\b(wifi|wi-fi|extender|router|ethernet|range\s*extender)\b/i.test(name);
}

// ─── Rules ────────────────────────────────────────────────────────────────────
//
// Each rule:
//   slugPatterns  — slug must contain at least one of these substrings
//   productTest   — function(productName) → true if the product triggers this rule
//   NOT patterns  — slug must NOT contain any of these (exceptions that make the product valid)
//   message       — what to print
//   level         — 'error' | 'warn'
//
// Rule philosophy: only flag combinations that are *clearly* wrong, not just
// unexpected. An HDMI cable is valid for signal/display/audio issues even on
// a console article. Only flag when the slug strongly implies the product
// is irrelevant (e.g., a pure network error article with an HDMI cable).

const RULES = [
  // ── Network/WiFi articles should NOT have an HDMI cable ────────────────────
  {
    slugPatterns: ["wifi", "wi-fi", "network-connection", "internet-connection",
                   "wont-connect", "not-connecting", "buffering", "dns-error",
                   "nat-type", "ip-address"],
    notPatterns:  ["hdmi", "earc", "arc", "signal", "no-signal", "black-screen",
                   "input", "picture"],
    productTest:  isHdmiCable,
    level:        "error",
    message:      "HDMI cable listed for a network/connectivity article — use a Wi-Fi extender or Ethernet cable instead",
  },

  // ── Firmware/update error articles should NOT have an HDMI cable ──────────
  {
    slugPatterns: ["firmware-update-error", "firmware-update-fail",
                   "update-error", "software-update-error"],
    notPatterns:  ["hdmi", "signal", "black-screen"],
    productTest:  isHdmiCable,
    level:        "error",
    message:      "HDMI cable listed for a firmware update error article — use a Wi-Fi extender instead",
  },

  // ── Controller charging articles should NOT have an HDMI cable ────────────
  {
    slugPatterns: ["controller-not-charging", "controller-charging",
                   "dualsense-not-charging", "gamepad-not-charging",
                   "controller-wont-charge"],
    notPatterns:  [],
    productTest:  isHdmiCable,
    level:        "error",
    message:      "HDMI cable listed for a controller charging article — use a USB-C charging cable instead",
  },

  // ── Overheating articles should NOT have an HDMI cable ────────────────────
  {
    slugPatterns: ["overheating", "overheat", "loud-fan", "fan-noise",
                   "thermal-shutdown", "shutting-down-randomly-overheating"],
    notPatterns:  [],
    productTest:  isHdmiCable,
    level:        "error",
    message:      "HDMI cable listed for an overheating article — use a cooling fan or compressed air duster instead",
  },

  // ── Disc drive error articles should NOT have an HDMI cable ───────────────
  {
    slugPatterns: ["disc-not-reading", "disc-read-error", "disc-drive-not",
                   "blu-ray-not-reading", "dvd-not-reading", "disc-compatibility"],
    notPatterns:  [],
    productTest:  isHdmiCable,
    level:        "error",
    message:      "HDMI cable listed for a disc drive error article — use a disc lens cleaner instead",
  },

  // ── Headset/audio-jack articles on consoles should NOT have an HDMI cable ─
  {
    slugPatterns: ["headset-not-working", "headset-no-sound", "headphone-not-working"],
    notPatterns:  ["hdmi", "earc", "tv-audio", "soundbar"],
    productTest:  isHdmiCable,
    level:        "warn",
    message:      "HDMI cable listed for a headset issue article — consider a gaming headset as product instead",
  },

  // ── Surge/power articles should NOT have an HDMI cable ────────────────────
  {
    slugPatterns: ["wont-turn-on", "won-t-turn-on", "not-turning-on",
                   "light-flashing-wont-turn", "keeps-restarting-wont-turn"],
    notPatterns:  ["hdmi", "signal", "black-screen", "no-signal"],
    productTest:  isHdmiCable,
    level:        "warn",
    message:      "HDMI cable listed for a power/boot article — consider a surge protector as product instead",
  },

  // ── Sanity: HDMI article with a network product (probably wrong) ───────────
  {
    slugPatterns: ["hdmi-not-working", "hdmi-no-signal", "hdmi-black-screen",
                   "earc-not-working", "arc-not-working", "no-hdmi-signal"],
    notPatterns:  ["wifi", "network", "internet"],
    productTest:  isNetworkProduct,
    level:        "warn",
    message:      "Wi-Fi/network product listed for an HDMI signal article — consider an HDMI cable as product instead",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

function checkFile(filePath, data) {
  const slug = (data.slug || "").toLowerCase();
  const products = Array.isArray(data.products) ? data.products : [];
  const findings = [];

  for (const rule of RULES) {
    const slugMatchesAny = rule.slugPatterns.some((p) => slug.includes(p));
    if (!slugMatchesAny) continue;

    const slugMatchesException = (rule.notPatterns || []).some((p) => slug.includes(p));
    if (slugMatchesException) continue;

    for (const product of products) {
      const name = product.name || "";
      if (rule.productTest(name)) {
        findings.push({
          level: rule.level,
          message: rule.message,
          product: name,
        });
        break; // one finding per rule per file is enough
      }
    }
  }

  return findings;
}

function main() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  let errorCount = 0;
  let warnCount = 0;
  const allFindings = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const findings = checkFile(filePath, parsed.data);
    if (findings.length > 0) {
      allFindings.push({ file, findings });
      errorCount += findings.filter((f) => f.level === "error").length;
      warnCount  += findings.filter((f) => f.level === "warn").length;
    }
  }

  if (allFindings.length > 0) {
    for (const { file, findings } of allFindings) {
      for (const f of findings) {
        const prefix = f.level === "error" ? "❌ ERROR" : "⚠️  WARN";
        console.error(`${prefix} [product-relevance] ${file}`);
        console.error(`  ${f.message}`);
        console.error(`  Product: "${f.product}"`);
        console.error("");
      }
    }
  }

  const summary = `Product relevance check: ${errorCount} error(s), ${warnCount} warning(s) across ${files.length} articles`;
  console.log(summary);

  if (errorCount > 0) {
    console.error(`\n❌ ${errorCount} product relevance error(s) found — fix before committing`);
    process.exit(1);
  } else {
    console.log("✅ Product relevance check passed");
  }
}

main();
