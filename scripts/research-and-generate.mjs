// scripts/research-and-generate.mjs
// Hits Google Autocomplete with brand+symptom seeds, scores by troubleshooting
// intent, filters existing slugs, checks AV relevance, deduplicates fuzzy
// matches, and generates up to MAX_NEW_ARTICLES via OpenAI.
//
// Articles are born published (no `published: false`) — quality gates in the
// GitHub Actions workflow catch problems before commit.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import "dotenv/config";
import { inferCategorySlugFromHints } from "../lib/categoryMapping.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const MAX_NEW_ARTICLES = 20;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const BRANDS = [
  "LG", "Samsung", "Sony", "TCL", "Vizio", "Hisense",
  "Denon", "Yamaha", "Onkyo", "Marantz",
  "Sonos", "Bose", "Polk Audio",
  "Roku", "Fire TV", "Apple TV", "Nvidia Shield", "Chromecast",
  "Xbox Series X", "Xbox Series S", "PS5",
];

const SYMPTOMS = [
  "not working", "no sound", "no signal", "black screen",
  "keeps disconnecting", "won't turn on", "blinking light", "error code",
  "hdmi not working", "wifi not connecting", "remote not working",
  "keeps restarting", "no picture", "audio out of sync",
  "4k not working", "hdr not working", "dolby atmos not working",
  "earc not working", "arc not working", "buffering",
];

const HIGH_INTENT = [
  "fix", "error", "not working", "won't", "wont", "doesn't", "doesnt",
  "no sound", "no signal", "black screen", "blinking", "reset",
  "troubleshoot", "keeps", "stopped", "broken", "failed",
];

const IGNORE_TERMS = [
  "review", "price", "buy", "best", "vs", "compare", "specs",
  "release date", "cost", "deal", "discount", "refurbished",
  "unboxing", "setup guide", "how to set up", "manual",
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC-AWARE PRODUCT SELECTION
// Picks an affiliate product relevant to the article slug/category.
// Rules:
//   - Network/WiFi articles → WiFi extender (not HDMI cable)
//   - Power/restart/flashing articles → Surge protector (not HDMI cable)
//   - Overheating articles → Cooling fan (not HDMI cable)
//   - Controller charging/sync articles → USB-C cable (not HDMI cable)
//   - Headset/audio jack articles → Gaming headset (not HDMI cable)
//   - Disc drive error articles → Disc lens cleaner (not HDMI cable)
//   - Remote/battery articles → Batteries (not HDMI cable)
//   - HDMI/signal/eARC/input/picture articles → HDMI cable (correct)
//   - Default → HDMI cable (most A/V topics are connection-related)
// ─────────────────────────────────────────────────────────────────────────────

function pickProductForTopic(slug, categorySlug) {
  const topic = ((slug || "") + " " + (categorySlug || "")).toLowerCase();
  const has = (...words) => words.some((w) => topic.includes(w));

  // Network / connectivity issues — Wi-Fi extender
  if (
    has("wifi", "wi-fi", "network", "internet", "buffer", "ethernet",
        "dns", "nat", "timeout", "connect", "disconnect") &&
    !has("hdmi", "earc", "arc", "signal", "input")
  ) {
    return {
      name: "TP-Link WiFi Range Extender",
      description:
        "Extends Wi-Fi signal to reach your devices reliably — reduces buffering, " +
        "connection drops, and network timeout errors.",
      url: "https://www.amazon.com/s?k=TP-Link+WiFi+Range+Extender&tag=buildguiders-20",
    };
  }

  // Controller charging / sync issues — USB-C cable
  if (
    has("charging", "not-charging", "charge", "usb-c", "dualsense", "sync") &&
    has("controller", "dualsense", "gamepad") &&
    !has("hdmi")
  ) {
    return {
      name: "USB-C Charging Cable (6 ft)",
      description:
        "A quality USB-C cable for reliable controller charging — compatible with " +
        "PS5 DualSense and Xbox Series controllers.",
      url: "https://www.amazon.com/s?k=usb-c+charging+cable+6ft&tag=buildguiders-20",
    };
  }

  // Headset / audio jack issues on consoles — gaming headset
  if (
    has("headset", "headphone", "microphone", "no-sound", "no-audio") &&
    has("controller", "ps5", "xbox", "console")
  ) {
    return {
      name: "Gaming Headset",
      description:
        "A compatible wired gaming headset for diagnosing controller audio jack " +
        "output issues on PS5 and Xbox.",
      url: "https://www.amazon.com/s?k=gaming+headset+ps5+xbox&tag=buildguiders-20",
    };
  }

  // Disc drive / optical disc errors — disc lens cleaner
  if (has("disc", "blu-ray", "bluray", "dvd") && has("read", "error", "drive", "not")) {
    return {
      name: "Disc Lens Cleaner",
      description:
        "A disc lens cleaning kit resolves read errors caused by dirty or degraded " +
        "laser optics in Blu-ray and DVD drives.",
      url: "https://www.amazon.com/s?k=disc+lens+cleaner+dvd+bluray&tag=buildguiders-20",
    };
  }

  // Overheating / fan noise — cooling accessory
  if (has("overheat", "overheating", "cooling", "loud", "fan", "thermal", "heat")) {
    return {
      name: "Compressed Air Duster",
      description:
        "Compressed air for cleaning dust from console vents — the most common cause " +
        "of overheating and loud fan noise.",
      url: "https://www.amazon.com/s?k=compressed+air+duster+electronics&tag=buildguiders-20",
    };
  }

  // Power / boot / flashing light issues — surge protector
  if (
    has("wont-turn", "won-t-turn", "not-turning", "flashing", "blinking",
        "restart", "restarting", "surge", "power-issue", "boot") &&
    !has("hdmi", "earc", "arc", "signal")
  ) {
    return {
      name: "Surge Protector Power Strip",
      description:
        "Protects home theater equipment from power surges that cause boot failures, " +
        "unexpected restarts, and flashing power lights.",
      url: "https://www.amazon.com/s?k=surge+protector+power+strip&tag=buildguiders-20",
    };
  }

  // Remote / battery issues — batteries
  if (has("remote") && has("not-working", "pairing", "battery", "batteries", "pair")) {
    return {
      name: "AA Rechargeable Batteries",
      description:
        "Rechargeable AA batteries to keep remotes and accessories powered reliably.",
      url: "https://www.amazon.com/s?k=rechargeable+aa+batteries&tag=buildguiders-20",
    };
  }

  // Default — HDMI cable (appropriate for signal, display, eARC, and most A/V topics)
  return {
    name: "Certified Ultra High Speed HDMI Cable",
    description:
      "A Certified Ultra High Speed HDMI cable ensures reliable 4K HDR signal and " +
      "eARC audio passthrough for home theater setups.",
    url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable&tag=buildguiders-20",
  };
}

const AFFILIATE_NOTE =
  "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

// ─────────────────────────────────────────────────────────────────────────────
// SPEC VERIFICATION — web-search lookup for model-specific articles
//
// When the title references a specific product model, we do a quick search
// to fetch verified specs BEFORE writing the article. This catches model-level
// errors (wrong HDMI port count, wrong refresh rate, wrong eARC tier, etc.)
// that no static validator can catch because they vary per model.
//
// Uses gpt-4o-search-preview (or SPEC_VERIFY_MODEL env override).
// Set SPEC_VERIFY_ENABLED=false to skip (e.g., for offline testing).
// Hard timeout: 15s — if the search is slow, article is still generated
// without the verified context rather than blocking the pipeline.
// ─────────────────────────────────────────────────────────────────────────────

const SPEC_VERIFY_MODEL = process.env.SPEC_VERIFY_MODEL || "gpt-4o-search-preview";
const SPEC_VERIFY_ENABLED = process.env.SPEC_VERIFY_ENABLED !== "false";
const SPEC_VERIFY_TIMEOUT_MS = 15_000;

// Patterns that indicate a specific product model is present in the title.
// We only bother fetching specs when we can detect a model number —
// generic titles like "Samsung TV HDMI not working" don't need it.
// NOTE: JavaScript regex does NOT support the `x` (extended) flag, so the
// pattern is assembled from named pieces and compiled via the RegExp
// constructor. Whitespace inside individual alternatives is intentional
// (e.g. "fire tv stick 4k max"); the literal-space sequences are matched
// via \s+ after assembly.
const MODEL_ALTERNATIVES = [
  // TV models
  String.raw`[cbgz]\d{1,2}[a-z]?\d*`,        // LG C4, G3, B4, Z3
  String.raw`a\d{2,3}[a-z]?`,                 // Sony A80K, A95K
  String.raw`x\d{3,4}[a-z]*`,                 // Sony X90L, X93L
  String.raw`qn\d{2,3}[a-z]+`,                // Samsung QN90D, QN85C
  String.raw`s\d{2}[a-z]+`,                   // Samsung S90F, S95D
  String.raw`u\d{1,2}[a-z]`,                  // Hisense U8N, U7K
  String.raw`qm\d{1,2}`,                      // TCL QM8, QM7
  // Receiver models
  String.raw`avr-[a-z0-9-]+`,                 // Denon AVR-X3700H
  String.raw`rx-[a-z0-9]+`,                   // Yamaha RX-V6A, RX-A2A
  String.raw`tx-nr?\d{3,4}[a-z]*`,            // Onkyo TX-NR696
  String.raw`nr\d{4}[a-z]*`,                  // Marantz NR1711
  String.raw`sr\d{4}[a-z]*`,                  // Marantz SR6015, SR7015
  String.raw`str-[a-z0-9]+`,                  // Sony STR-DN1080, STR-AZ7000ES
  // Soundbar models
  String.raw`hw-[a-z0-9]+`,                   // Samsung HW-Q990D
  String.raw`ht-[a-z0-9]+`,                   // Sony HT-A7000, HT-S350
  String.raw`soundbar\s+\d{3,4}`,             // Bose Soundbar 900
  // Streaming devices
  String.raw`fire\s+tv\s+stick\s+4k\s*max`,   // Fire TV Stick 4K Max
  String.raw`apple\s+tv\s+4k\s*\(?\d{4}`,     // Apple TV 4K (2022)
  String.raw`nvidia\s+shield\s+tv\s+pro`,     // Nvidia Shield TV Pro
  // Error codes (treated as model-specific)
  String.raw`0x[0-9a-f]{6,}`,                 // Xbox/PlayStation hex error codes
  String.raw`(?:ce|nw|su|wc|e)-?\d{5,}`,      // Sony/PS5 error codes
];

const HAS_MODEL_RE = new RegExp(
  String.raw`\b(?:${MODEL_ALTERNATIVES.join("|")})\b`,
  "i"
);

/**
 * Fetch verified product specs from the web for a model-specific article.
 * Returns a compact bullet-point string or null if:
 *   - No model detected in the title
 *   - Spec verification is disabled
 *   - The search times out or errors
 */
async function fetchVerifiedSpecs(client, title, brand) {
  if (!SPEC_VERIFY_ENABLED) return null;
  if (!HAS_MODEL_RE.test(title)) return null;

  const prompt =
    `Search for confirmed technical specifications for the specific product in this article title:\n` +
    `"${title}" (Brand: ${brand})\n\n` +
    `Return ONLY facts you can confirm from manufacturer spec sheets or trusted review sites (RTings, CNET, The Verge, AVS Forum).\n` +
    `Include the following if applicable and confirmed:\n` +
    `• Panel technology (TVs: OLED / QD-OLED / Mini-LED / QLED / LED-LCD)\n` +
    `• HDR formats: which of HDR10 / HDR10+ / Dolby Vision / HLG are supported\n` +
    `• HDMI ports: how many total, how many are HDMI 2.1 (48 Gbps) vs HDMI 2.0, which port has eARC\n` +
    `• Maximum gaming resolution and refresh rate (e.g., 4K@120Hz or 1440p@120Hz)\n` +
    `• ARC-only vs eARC (for receivers and soundbars: specify the port)\n` +
    `• Channel configuration for receivers (e.g., 7.2.4 Dolby Atmos decoding)\n` +
    `• Whether the device decodes Dolby Atmos or only passes it through\n\n` +
    `If the title does not reference a specific product model, reply exactly: NO_MODEL\n` +
    `Keep the response under 200 words. Return only the bullet points — no introduction, no sources list.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SPEC_VERIFY_TIMEOUT_MS);

    const response = await client.chat.completions.create(
      {
        model: SPEC_VERIFY_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: 0,
      },
      { signal: controller.signal },
    );
    clearTimeout(timer);

    const raw = response.choices?.[0]?.message?.content?.trim() || "";
    if (!raw || raw.startsWith("NO_MODEL") || raw.length < 30) return null;

    // Strip citation markers ([1], [^2], etc.) that search models add
    const cleaned = raw.replace(/\s*\[\^?\d+\]/g, "").trim();
    console.log(`  [spec-verify] Fetched specs for "${title.substring(0, 60)}"`);
    return cleaned;
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`  [spec-verify] Timed out after ${SPEC_VERIFY_TIMEOUT_MS / 1000}s — continuing without verified specs`);
    } else {
      console.warn(`  [spec-verify] Error: ${err.message} — continuing without verified specs`);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELEVANCE FILTERING — keep only home theater / AV topics
// ─────────────────────────────────────────────────────────────────────────────

const AV_RELEVANCE_TERMS = [
  "tv", "television", "receiver", "avr", "soundbar", "sound bar",
  "hdmi", "earc", "arc", "4k", "hdr", "dolby", "atmos", "dts",
  "surround", "audio", "sound", "speaker", "subwoofer", "remote",
  "streaming", "roku", "fire tv", "apple tv", "chromecast",
  "nvidia shield", "ps5", "playstation", "xbox", "gaming console",
  "screen", "display", "picture", "signal", "input", "output",
  "firmware", "update", "reset", "wifi", "bluetooth", "optical",
  "volume", "mute", "power", "standby", "cec",
  "lip sync", "buffering", "lag", "latency", "error code", "error",
  "no sound", "no signal", "black screen", "blinking", "flashing",
  "not working", "not connecting", "not turning on",
];

const OFF_TOPIC_TERMS = [
  "motorcycle", "motorbike", "scooter", "bike", "yzf", "r125", "r1m",
  "r6", "mt-", "fz-", "wr-", "xsr",
  "piano", "keyboard", "p-115", "p115", "p-125", "p125", "clavinova",
  "guitar", "amp pedal", "drum", "synthesizer", "psr", "dgx",
  "boat", "outboard", "marine", "jet ski", "waverunner",
  "generator", "pressure washer", "lawn mower", "snowblower",
  "car stereo", "car audio", "head unit", "car speaker",
  "golf cart", "atv", "side by side",
];

function isAVRelevant(suggestion) {
  const lower = suggestion.toLowerCase();
  if (OFF_TOPIC_TERMS.some((t) => lower.includes(t))) return false;
  return AV_RELEVANCE_TERMS.some((t) => lower.includes(t));
}

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY SLUG DEDUPLICATION — Jaccard similarity on word sets
// ─────────────────────────────────────────────────────────────────────────────

function slugsAreSimilar(slugA, slugB, threshold = 0.85) {
  const wordsA = new Set(slugA.split("-"));
  const wordsB = new Set(slugB.split("-"));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 && intersection.size / union.size >= threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// TITLE CASING — ported from scripts/fix-frontmatter.cjs
// ─────────────────────────────────────────────────────────────────────────────

const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
  "in", "on", "at", "to", "by", "of", "up", "as", "is", "if",
  "vs", "with", "from", "not",
]);

const UPPER_WORDS = new Set([
  "tv", "hdmi", "ps5", "hdr", "4k", "usb", "wifi", "wi-fi", "lan",
  "cec", "earc", "arc", "led", "oled", "qled", "dns", "vrr", "allm",
  "pc", "ir", "avr", "atmos", "dts",
]);

const BRAND_CASING = {
  "apple tv": "Apple TV",
  "ps5": "PS5",
  "roku": "Roku",
  "samsung": "Samsung",
  "sonos": "Sonos",
  "sony": "Sony",
  "lg": "LG",
  "tcl": "TCL",
  "vizio": "Vizio",
  "denon": "Denon",
  "onkyo": "Onkyo",
  "yamaha": "Yamaha",
  "marantz": "Marantz",
  "bose": "Bose",
  "fire tv": "Fire TV",
  "firestick": "Firestick",
  "xbox": "Xbox",
  "nvidia": "Nvidia",
  "polk": "Polk",
  "hisense": "Hisense",
};

const MODEL_PATTERN =
  /^(ce-\d+|nw-\d+|avr-[a-z0-9]+|tx-[a-z0-9]+|rx-[a-z0-9]+|rav\d+|sr\d+|nr\d+|pm\d+|cd\d+|p\d+|rs\d+|psw\d+|vaf\d+|ht-[a-z0-9]+|str-[a-z0-9]+|[a-z]\d{1,2}[a-z]?\d*|47le\d+|c\d{3,4}|q\d|s\d{3}[a-z]*|x\d{4}[a-z]*)$/i;

function titleCase(str) {
  let result = str;
  for (const [lower, proper] of Object.entries(BRAND_CASING)) {
    const regex = new RegExp(
      `\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    result = result.replace(regex, proper);
  }

  return result
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();

      // Already handled by brand casing
      for (const proper of Object.values(BRAND_CASING)) {
        if (word === proper || word === proper.split(" ")[0]) return word;
      }

      // Uppercase acronyms
      if (UPPER_WORDS.has(lower)) return word.toUpperCase();

      // Model numbers — uppercase
      if (MODEL_PATTERN.test(word)) return word.toUpperCase();

      // Error codes with hyphens (ce-10005-6)
      if (/^\w+-[\w-]+$/.test(word) && /\d/.test(word))
        return word.toUpperCase();

      // Minor words (not first word)
      if (i > 0 && MINOR_WORDS.has(lower)) return lower;

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getTitleSuffix(title) {
  const lower = title.toLowerCase();
  if (lower.includes("error")) return " — How to Fix It";
  if (
    lower.includes("not working") ||
    lower.includes("not connecting") ||
    lower.includes("not loading")
  )
    return " — Quick Fix Guide";
  if (
    lower.includes("not turning on") ||
    lower.includes("not powering on") ||
    lower.includes("won't turn on") ||
    lower.includes("wont turn on")
  )
    return " — What to Try";
  if (lower.includes("why is my")) return ""; // question format is already good
  if (lower.includes("fix ")) return ""; // already action-oriented
  if (lower.includes("blinking") || lower.includes("flashing"))
    return " — What It Means";
  if (lower.includes("slow") || lower.includes("laggy"))
    return " — Speed It Up";
  return " — Troubleshooting Guide";
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION & KEYWORD GENERATION — ported from scripts/fix-frontmatter.cjs
// ─────────────────────────────────────────────────────────────────────────────

function generateDescription(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandName = brand || "";

  const errorMatch = lower.match(/error\s+(?:code\s+)?([a-z0-9-_.]+)/i);
  if (errorMatch) {
    const code = errorMatch[1];
    return `${brandName} error ${code} stopping you? Here's how to diagnose the cause and fix it with step-by-step troubleshooting.`.trim();
  }

  if (lower.includes("not connecting")) {
    const target = lower.includes("internet")
      ? "the internet"
      : lower.includes("wifi") || lower.includes("wi-fi")
        ? "Wi-Fi"
        : lower.includes("tv")
          ? "the TV"
          : lower.includes("spotify")
            ? "Spotify"
            : lower.includes("pc")
              ? "PC"
              : "your network";
    return `${brandName} not connecting to ${target}? Run through these quick checks and fixes to restore the connection.`.trim();
  }

  if (lower.includes("not working")) {
    return `${brandName} not working as expected? Diagnose the issue and fix it with these proven troubleshooting steps.`.trim();
  }

  if (
    lower.includes("not turning on") ||
    lower.includes("not powering on") ||
    lower.includes("wont turn on") ||
    lower.includes("won't turn on")
  ) {
    return `${brandName} won't power on? Check these common causes and step-by-step fixes before calling for a repair.`.trim();
  }

  if (lower.includes("not loading")) {
    return `${brandName} stuck loading or won't open? Try these quick fixes to get it running again.`.trim();
  }

  if (lower.includes("not responding")) {
    return `${brandName} not responding? Here are the most effective fixes to get it working again.`.trim();
  }

  if (lower.startsWith("fix ")) {
    return `Quick, practical fixes for common ${brandName} issues. Step-by-step guide with diagnostics.`.trim();
  }

  if (lower.includes("blinking") || lower.includes("flashing")) {
    return `${brandName} light blinking or flashing? Here's what each pattern means and how to fix it.`.trim();
  }

  if (lower.includes("no sound") || lower.includes("not making sound")) {
    return `No sound from your ${brandName}? Troubleshoot audio output settings, connections, and firmware to restore audio.`.trim();
  }

  if (lower.includes("black screen")) {
    return `${brandName} showing a black screen? Fix HDMI signal, input settings, and display issues with these steps.`.trim();
  }

  if (lower.includes("green screen")) {
    return `${brandName} displaying a green screen? Here's how to fix the display output and restore normal picture.`.trim();
  }

  if (lower.includes("pink screen")) {
    return `${brandName} showing a pink screen? Fix display output settings and HDMI signal issues with these steps.`.trim();
  }

  if (lower.includes("remote")) {
    return `${brandName} remote not responding? Fix pairing, battery, IR sensor, and connection issues step by step.`.trim();
  }

  if (lower.includes("slow") || lower.includes("laggy")) {
    return `${brandName} running slow? Speed it up with these performance fixes and cache-clearing steps.`.trim();
  }

  if (lower.startsWith("why is my")) {
    return `Wondering ${lower}? Here are the most common causes and how to fix each one.`.trim();
  }

  // Default fallback
  return `Step-by-step troubleshooting guide for ${brandName} ${slug.replace(/-/g, " ").replace(brand?.toLowerCase() || "", "").trim()}.`.trim();
}

function generateKeywords(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandLower = (brand || "").toLowerCase();
  const slugPhrase = slug.replace(/-/g, " ");
  const keywords = [slugPhrase];

  if (lower.includes("error")) {
    const errorMatch = lower.match(/error\s+(?:code\s+)?([a-z0-9-_.]+)/i);
    if (errorMatch) {
      keywords.push(`${brandLower} error ${errorMatch[1]}`);
      keywords.push(`${brandLower} error code ${errorMatch[1]}`);
      keywords.push(`fix ${brandLower} error ${errorMatch[1]}`);
    }
  } else if (lower.includes("not")) {
    keywords.push(
      `${brandLower} ${lower.match(/not\s+\w+(\s+\w+)?/)?.[0] || "not working"}`,
    );
    keywords.push(`fix ${slugPhrase}`);
  } else if (lower.startsWith("why is my")) {
    keywords.push(slugPhrase.replace("why is my ", ""));
  } else if (lower.startsWith("fix ")) {
    keywords.push(slugPhrase.replace("fix ", ""));
    keywords.push(`how to ${slugPhrase}`);
  } else {
    keywords.push(`${brandLower} ${slugPhrase}`);
    keywords.push(`fix ${slugPhrase}`);
  }

  const unique = [...new Set(keywords.filter((k) => k.trim().length > 3))];
  return unique.slice(0, 5).join(", ");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLUGIFY
// ─────────────────────────────────────────────────────────────────────────────

const slugify = (s) => {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Quick self-test
(function validateSlugify() {
  const cases = [
    ["PS5 HDMI not working fix", "ps5-hdmi-not-working-fix"],
    ["Xbox Series S hdmi not working", "xbox-series-s-hdmi-not-working"],
    ["Samsung keeps restarting", "samsung-keeps-restarting"],
    [
      "LG TV HDMI not working black screen",
      "lg-tv-hdmi-not-working-black-screen",
    ],
    ["Denon error code 0x01", "denon-error-code-0x01"],
    ["Sonos arc not working", "sonos-arc-not-working"],
  ];
  for (const [input, expected] of cases) {
    const got = slugify(input);
    if (got !== expected) {
      throw new Error(
        `slugify broken: "${input}" → "${got}" (expected "${expected}")`,
      );
    }
  }
})();

const truncate = (s, max = 155) =>
  s.length > max ? s.slice(0, max - 1).trim() + "..." : s;

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING SLUG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getExistingSlugs() {
  if (!fs.existsSync(ARTICLES_DIR)) return new Set();
  return new Set(
    fs
      .readdirSync(ARTICLES_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(".mdx", "")),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────

async function getAutocompleteSuggestions(query) {
  try {
    const url =
      "http://suggestqueries.google.com/complete/search?client=chrome&q=" +
      encodeURIComponent(query);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scoreQuery(query) {
  const q = query.toLowerCase();
  if (IGNORE_TERMS.some((t) => q.includes(t))) return 0;
  if (!HIGH_INTENT.some((t) => q.includes(t))) return 0;
  let score = 10;
  if (/error\s*\d+|error\s*code|0x[0-9a-f]+|[a-z]{1,2}\d{3,6}/i.test(q))
    score += 15;
  if (q.includes("not working") || q.includes("won't")) score += 8;
  if (q.includes("fix") || q.includes("how to fix")) score += 6;
  if (q.includes("blinking") || q.includes("flashing")) score += 5;
  if (q.includes("black screen") || q.includes("no signal")) score += 5;
  if (q.includes("no sound") || q.includes("no audio")) score += 5;
  if (q.includes("keeps")) score += 4;
  if (q.includes("earc") || q.includes("arc") || q.includes("hdmi"))
    score += 4;
  if (q.includes("dolby") || q.includes("atmos") || q.includes("4k"))
    score += 3;
  const wc = q.split(/\s+/).length;
  if (wc >= 5) score += 3;
  if (wc >= 7) score += 2;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER IMAGE
// ─────────────────────────────────────────────────────────────────────────────

function getCoverImage(categorySlug, brand) {
  const b = brand.toLowerCase();
  if (categorySlug === "tvs") return "/images/gg/gg-tv-general.png";
  if (categorySlug === "receivers-amps") return "/images/gg/gg-receiver.png";
  if (categorySlug === "soundbars") return "/images/gg/gg-soundbar.png";
  if (categorySlug === "streaming-devices") return "/images/gg/gg-streaming.png";
  if (categorySlug === "cables-connections")
    return "/images/gg/gg-hdmi-cables.png";
  if (b.includes("ps5") || b.includes("xbox"))
    return "/images/gg/gg-gaming-console.png";
  return "/images/gg/gg-smart-home-device.png";
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONTMATTER — clean output, no published: false, no tags: []
// ─────────────────────────────────────────────────────────────────────────────

function buildFrontmatter(slug, title, brand, categorySlug, coverImage, product) {
  const date = new Date().toISOString().slice(0, 10);
  const description = truncate(generateDescription(title, slug, brand));
  const keywords = generateKeywords(title, slug, brand);
  const coverAlt = brand + " troubleshooting — " + title.replace(/ — .*$/, "");

  // Wrap description at ~80 chars for YAML readability
  const prodDesc = product.description.length > 80
    ? product.description.slice(0, 77).trimEnd() + "..."
    : product.description;

  return (
    "---\n" +
    "slug: " + slug + "\n" +
    "title: '" + title.replace(/'/g, "''") + "'\n" +
    "brand: " + brand + "\n" +
    "category: " + categorySlug + "\n" +
    "coverImage: " + coverImage + "\n" +
    "coverAlt: '" + coverAlt.replace(/'/g, "''") + "'\n" +
    "description: >-\n  " + description + "\n" +
    "keywords: '" + keywords + "'\n" +
    "date: '" + date + "'\n" +
    "published: true\n" +
    "tags: []\n" +
    "products:\n" +
    "  - name: " + product.name + "\n" +
    "    description: >-\n" +
    "      " + prodDesc + "\n" +
    "    url: '" + product.url + "'\n" +
    "    note: '" + AFFILIATE_NOTE + "'\n" +
    "---\n\n"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE BODY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generateArticleBody(
  client,
  title,
  brand,
  categorySlug,
  existingSlugs,
  product,
  verifiedSpecs = null,
) {
  const system =
    "You are a precise, helpful technical writer for BuildGuiders.com. " +
    "You write step-by-step home entertainment troubleshooting guides. " +
    "Your audience is non-technical consumers trying to fix their own gear. " +
    "Style: calm, direct, no filler. Use numbered steps for procedures. " +
    "Scope: living-room A/V gear only — TVs, AV receivers, soundbars, " +
    "speakers, subwoofers, streaming devices (Roku, Fire TV, Apple TV, " +
    "Chromecast, Nvidia Shield), gaming consoles (PS5, Xbox), HDMI cables, " +
    "and related connections. " +
    "Rules: No prices, ratings, time-sensitive claims, or raw HTML/JSX. " +
    "Include exactly one in-body affiliate link labeled (paid link). " +
    "Menu paths must be plausible for 2020-2026 firmware. " +
    "Each troubleshooting step should explain WHY it works, not just what to do.\n\n" +
    "CRITICAL FACTS — these are verified; do not contradict them:\n" +
    "CABLES: Cables have speed ratings, NOT version numbers. Never write 'HDMI 2.1 cable' or 'HDMI 2.0 cable'. " +
    "Correct terms: 'Certified Ultra High Speed HDMI cable' (48Gbps, 4K@120Hz), " +
    "'Certified Premium High Speed HDMI cable' (18Gbps, 4K@60Hz).\n" +
    "HDR: Samsung supports HDR10 and HDR10+ but NOT Dolby Vision. " +
    "LG supports Dolby Vision but NOT HDR10+. Sony supports both.\n" +
    "AUDIO: Optical/TOSLINK cannot carry Dolby Atmos or DTS:X — only compressed Dolby Digital 5.1 or stereo PCM. " +
    "ARC carries compressed audio only; eARC is required for lossless Atmos/DTS:X.\n" +
    "CONSOLES: Nintendo Switch outputs 1080p docked, 720p handheld — no 4K. " +
    "PS5 supports 4K@120Hz on select titles. Xbox Series S maxes at 1440p for games. " +
    "Xbox Series X supports 4K@120Hz.\n" +
    "STREAMING: Fire TV Stick Lite is 1080p only (not 4K). Roku Express is 1080p only.\n" +
    "CEC NAMES: Samsung=Anynet+, LG=SimpLink, Sony=Bravia Sync.\n" +
    "POWER CYCLE: Always recommend 30 seconds minimum wait after unplugging — never 10 seconds.\n" +
    "VIEWING DISTANCE: For TVs, the THX-recommended minimum FOV is 36 degrees. " +
    "Correct optimal ranges: 55\"=4.5-5.5ft, 65\"=5.5-7ft, 75\"=7-8ft, 85\"=8-9ft. " +
    "Do NOT recommend sitting farther than these maximums as ideal.";

  const relatedSlugs = Array.from(existingSlugs)
    .filter(
      (s) =>
        s.includes(brand.toLowerCase().replace(/\s+/g, "-")) ||
        s.includes(categorySlug.split("-")[0]),
    )
    .slice(0, 3);
  const relatedLinksHint =
    relatedSlugs.length > 0
      ? "\n\nFor the Related fixes section use ONLY these real internal links:\n" +
        relatedSlugs
          .map((s) => "- [" + s.replace(/-/g, " ") + "](/" + s + ")")
          .join("\n")
      : "";

  // Inject verified specs prominently if available — the model must honour these.
  const specsBlock = verifiedSpecs
    ? "\n\nVERIFIED PRODUCT SPECS (web-searched before generation — treat these as ground truth; " +
      "do NOT contradict or deviate from these facts):\n" + verifiedSpecs + "\n"
    : "";

  const user =
    "Write an MDX article body (NO frontmatter, NO H1 heading — the title " +
    "is rendered separately from frontmatter). Start directly with the " +
    "first H2 section.\n\n" +
    "Title: " + title + "\n" +
    "Brand: " + brand + "\n" +
    "Category: " + categorySlug +
    specsBlock + "\n\n";
    "Structure (use H2 headings in this order):\n" +
    "1. Quick answer — 3-4 bullet points with the TL;DR fix\n" +
    "2. Symptoms — what the user sees/hears\n" +
    "3. Quick checks — 3-5 things to verify before deep troubleshooting\n" +
    "4. Step-by-step fix — numbered steps with specific menu paths\n" +
    "5. If it still isn't working — escalation path\n" +
    "6. FAQ — 3-5 Q&As in bold question / paragraph answer format\n\n" +
    "Rules:\n" +
    "- Insert exactly one affiliate link: [" + product.name + " (paid link)](" + product.url + ") placed where it helps the reader most — only in a step where this product is genuinely relevant.\n" +
    "- No prices, ratings, or time-sensitive claims.\n" +
    "- Calm, direct tone. Explain WHY each step works.\n" +
    "- Use bold for menu paths: **Settings > Sound > Audio Output**.\n" +
    "- Minimum 400 words of substantive content." +
    relatedLinksHint;

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 2500,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content)
    throw new Error("No content returned from OpenAI for: " + title);
  return content.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const existingSlugs = getExistingSlugs();
  console.log(
    "Found " + existingSlugs.size + " existing articles — skipping those.\n",
  );
  console.log("Researching topics via Google Autocomplete...\n");

  const scored = new Map();
  let filteredOffTopic = 0;
  let filteredFuzzyDupe = 0;

  for (const brand of BRANDS) {
    for (const symptom of SYMPTOMS) {
      const suggestions = await getAutocompleteSuggestions(
        brand + " " + symptom,
      );
      for (const suggestion of suggestions) {
        const score = scoreQuery(suggestion);
        if (score === 0) continue;

        // Relevance check — skip non-AV topics
        if (!isAVRelevant(suggestion)) {
          filteredOffTopic++;
          continue;
        }

        const slug = slugify(suggestion);
        if (!slug || existingSlugs.has(slug)) continue;

        // Fuzzy dedup against existing articles
        const isFuzzyDupeExisting = [...existingSlugs].some((existing) =>
          slugsAreSimilar(slug, existing),
        );
        if (isFuzzyDupeExisting) {
          filteredFuzzyDupe++;
          continue;
        }

        // Fuzzy dedup within this batch
        const isFuzzyDupeBatch = [...scored.keys()].some((existingSlug) =>
          slugsAreSimilar(slug, existingSlug),
        );
        if (isFuzzyDupeBatch) {
          filteredFuzzyDupe++;
          continue;
        }

        if (scored.has(slug)) {
          if (score > scored.get(slug).score) scored.get(slug).score = score;
          continue;
        }

        const title = titleCase(suggestion) + getTitleSuffix(titleCase(suggestion));
        const categorySlug = inferCategorySlugFromHints([suggestion, brand]);
        scored.set(slug, {
          title,
          brand,
          score,
          categorySlug,
          coverImage: getCoverImage(categorySlug, brand),
        });
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log(
    "Filtered: " +
      filteredOffTopic +
      " off-topic, " +
      filteredFuzzyDupe +
      " fuzzy duplicates\n",
  );

  const ranked = Array.from(scored.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, MAX_NEW_ARTICLES);

  if (ranked.length === 0) {
    console.log(
      "No new topics found — all autocomplete suggestions already exist as articles.",
    );
    return;
  }

  console.log("Top " + ranked.length + " new topics:\n");
  ranked.forEach(([, { title, score }], i) =>
    console.log(
      "  " + String(i + 1).padStart(2) + ". [score:" + score + "] " + title,
    ),
  );
  console.log();

  if (!fs.existsSync(ARTICLES_DIR))
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });

  for (const [slug, { title, brand, categorySlug, coverImage }] of ranked) {
    const filePath = path.join(ARTICLES_DIR, slug + ".mdx");
    if (fs.existsSync(filePath)) {
      console.log("Skipping: " + slug);
      continue;
    }
    try {
      console.log("Generating: " + title);
      const product = pickProductForTopic(slug, categorySlug);
      const verifiedSpecs = await fetchVerifiedSpecs(client, title, brand);
      const body = await generateArticleBody(
        client,
        title,
        brand,
        categorySlug,
        existingSlugs,
        product,
        verifiedSpecs,
      );
      const fm = buildFrontmatter(slug, title, brand, categorySlug, coverImage, product);
      fs.writeFileSync(filePath, fm + body + "\n", "utf8");
      existingSlugs.add(slug); // prevent dupes within this run
      console.log("Created: " + slug + ".mdx\n");
    } catch (err) {
      console.error("Failed: " + slug + " — " + err.message);
    }
  }

  console.log("Research and generation complete.");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
