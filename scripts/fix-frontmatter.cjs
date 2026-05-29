/**
 * Batch fix frontmatter for articles with:
 * 1. All-lowercase titles (convert to proper title + benefit suffix)
 * 2. Generic "How to troubleshoot and fix X quickly" descriptions
 * 3. Word-split keyword spam
 *
 * Only touches files matching the bad patterns. Does NOT touch:
 * - Files with already-proper titles (capitalized, descriptive)
 * - Buying guides (best-*.mdx)
 * - Files we've already manually fixed
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const articlesDir = path.join(__dirname, "..", "content", "articles");

// Words that should stay lowercase in title case (unless first word)
const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
  "in", "on", "at", "to", "by", "of", "up", "as", "is", "if",
  "vs", "with", "from", "not"
]);

// Words that should stay uppercase
const UPPER_WORDS = new Set([
  "tv", "hdmi", "ps5", "hdr", "4k", "usb", "wifi", "wi-fi", "lan",
  "cec", "earc", "arc", "led", "oled", "qled", "dns", "vrr", "allm",
  "pc", "ir", "avr", "atmos", "dts"
]);

// Brand names with proper casing
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

// Model numbers / codes to preserve as-is (uppercase)
const MODEL_PATTERN = /^(ce-\d+|nw-\d+|avr-[a-z0-9]+|tx-[a-z0-9]+|rx-[a-z0-9]+|rav\d+|sr\d+|nr\d+|pm\d+|cd\d+|p\d+|rs\d+|psw\d+|vaf\d+|yzf-[a-z0-9]+|[a-z]\d{1,2}[a-z]?\d*|47le\d+|c\d{3,4}|q\d|s\d{3}[a-z]*|x\d{4}[a-z]*)$/i;

function titleCase(str) {
  // First, apply brand casing
  let result = str;
  for (const [lower, proper] of Object.entries(BRAND_CASING)) {
    const regex = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
    result = result.replace(regex, proper);
  }

  return result.split(/\s+/).map((word, i) => {
    const lower = word.toLowerCase();

    // Check if already handled by brand casing
    for (const proper of Object.values(BRAND_CASING)) {
      if (word === proper || word === proper.split(" ")[0]) return word;
    }

    // Uppercase acronyms
    if (UPPER_WORDS.has(lower)) return word.toUpperCase();

    // Model numbers - uppercase
    if (MODEL_PATTERN.test(word)) return word.toUpperCase();

    // Error codes with hyphens (ce-10005-6)
    if (/^\w+-[\w-]+$/.test(word) && /\d/.test(word)) return word.toUpperCase();

    // Minor words (not first word)
    if (i > 0 && MINOR_WORDS.has(lower)) return lower;

    // Capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1);

  }).join(" ");
}

function generateDescription(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandName = brand || "";

  // Error code patterns
  const errorMatch = lower.match(/error\s+(?:code\s+)?([a-z0-9-_.]+)/i);
  if (errorMatch) {
    const code = errorMatch[1];
    return `${brandName} error ${code} stopping you? Here's how to diagnose the cause and fix it with step-by-step troubleshooting.`.trim();
  }

  // "not connecting" patterns
  if (lower.includes("not connecting")) {
    const target = lower.includes("internet") ? "the internet"
      : lower.includes("wifi") || lower.includes("wi-fi") ? "Wi-Fi"
      : lower.includes("tv") ? "the TV"
      : lower.includes("spotify") ? "Spotify"
      : lower.includes("pc") ? "PC"
      : "your network";
    return `${brandName} not connecting to ${target}? Run through these quick checks and fixes to restore the connection.`.trim();
  }

  // "not working" patterns
  if (lower.includes("not working")) {
    return `${brandName} not working as expected? Diagnose the issue and fix it with these proven troubleshooting steps.`.trim();
  }

  // "not turning on" / "not powering on" / "won't turn on"
  if (lower.includes("not turning on") || lower.includes("not powering on") || lower.includes("wont turn on") || lower.includes("won't turn on")) {
    return `${brandName} won't power on? Check these common causes and step-by-step fixes before calling for a repair.`.trim();
  }

  // "not loading"
  if (lower.includes("not loading")) {
    return `${brandName} stuck loading or won't open? Try these quick fixes to get it running again.`.trim();
  }

  // "not responding"
  if (lower.includes("not responding")) {
    return `${brandName} not responding? Here are the most effective fixes to get it working again.`.trim();
  }

  // "fix" patterns
  if (lower.startsWith("fix ")) {
    return `Quick, practical fixes for common ${brandName} issues. Step-by-step guide with diagnostics.`.trim();
  }

  // "blinking" / "flashing" patterns
  if (lower.includes("blinking") || lower.includes("flashing")) {
    return `${brandName} light blinking or flashing? Here's what each pattern means and how to fix it.`.trim();
  }

  // "no sound" / "not making sound"
  if (lower.includes("no sound") || lower.includes("not making sound")) {
    return `No sound from your ${brandName}? Troubleshoot audio output settings, connections, and firmware to restore audio.`.trim();
  }

  // "black screen"
  if (lower.includes("black screen")) {
    return `${brandName} showing a black screen? Fix HDMI signal, input settings, and display issues with these steps.`.trim();
  }

  // "green screen"
  if (lower.includes("green screen")) {
    return `${brandName} displaying a green screen? Here's how to fix the display output and restore normal picture.`.trim();
  }

  // "pink screen"
  if (lower.includes("pink screen")) {
    return `${brandName} showing a pink screen? Fix display output settings and HDMI signal issues with these steps.`.trim();
  }

  // remote patterns
  if (lower.includes("remote")) {
    return `${brandName} remote not responding? Fix pairing, battery, IR sensor, and connection issues step by step.`.trim();
  }

  // "slow" / "laggy"
  if (lower.includes("slow") || lower.includes("laggy")) {
    return `${brandName} running slow? Speed it up with these performance fixes and cache-clearing steps.`.trim();
  }

  // "why is my" question format
  if (lower.startsWith("why is my")) {
    return `Wondering ${lower}? Here are the most common causes and how to fix each one.`.trim();
  }

  // "has sonos fixed"
  if (lower.includes("has") && lower.includes("fixed")) {
    return `Latest update on the current state of the issue and what workarounds are available.`.trim();
  }

  // Default fallback
  return `Step-by-step troubleshooting guide for ${brandName} ${slug.replace(/-/g, " ").replace(brand?.toLowerCase() || "", "").trim()}.`.trim();
}

function generateKeywords(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandLower = (brand || "").toLowerCase();

  // Build keyword phrases from the slug
  const slugPhrase = slug.replace(/-/g, " ");

  // Core keyword is usually the slug itself
  const keywords = [slugPhrase];

  // Add brand + core problem variant
  if (lower.includes("error")) {
    const errorMatch = lower.match(/error\s+(?:code\s+)?([a-z0-9-_.]+)/i);
    if (errorMatch) {
      keywords.push(`${brandLower} error ${errorMatch[1]}`);
      keywords.push(`${brandLower} error code ${errorMatch[1]}`);
      keywords.push(`fix ${brandLower} error ${errorMatch[1]}`);
    }
  } else if (lower.includes("not")) {
    keywords.push(`${brandLower} ${lower.match(/not\s+\w+(\s+\w+)?/)?.[0] || "not working"}`);
    keywords.push(`fix ${slugPhrase}`);
  } else if (lower.startsWith("why is my")) {
    keywords.push(slugPhrase);
    keywords.push(slugPhrase.replace("why is my ", ""));
  } else if (lower.startsWith("fix ")) {
    keywords.push(slugPhrase.replace("fix ", ""));
    keywords.push(`how to ${slugPhrase}`);
  } else {
    keywords.push(`${brandLower} ${slugPhrase}`);
    keywords.push(`fix ${slugPhrase}`);
  }

  // Deduplicate and limit
  const unique = [...new Set(keywords.filter(k => k.trim().length > 3))];
  return unique.slice(0, 5).join(", ");
}

// Suffix to append to titles for CTR
function getTitleSuffix(title) {
  const lower = title.toLowerCase();
  if (lower.includes("error")) return " — How to Fix It";
  if (lower.includes("not working") || lower.includes("not connecting") || lower.includes("not loading")) return " — Quick Fix Guide";
  if (lower.includes("not turning on") || lower.includes("not powering on") || lower.includes("won't turn on") || lower.includes("wont turn on")) return " — What to Try";
  if (lower.includes("why is my")) return "";  // question format is already good
  if (lower.includes("fix ")) return "";  // already action-oriented
  if (lower.includes("blinking") || lower.includes("flashing")) return " — What It Means";
  if (lower.includes("slow") || lower.includes("laggy")) return " — Speed It Up";
  return " — Troubleshooting Guide";
}

// ---- MAIN ----
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith(".mdx"));
let fixed = 0;
let skipped = 0;
const changes = [];

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  const raw = fs.readFileSync(filePath, "utf8");

  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    console.warn(`⚠️  Could not parse ${file}: ${e.message}`);
    continue;
  }

  const { data, content } = parsed;
  const title = data.title || "";
  const desc = data.description || "";

  // Only fix files with GENERIC pattern descriptions
  const isGenericDescA = /^How to troubleshoot and fix ".*" quickly\.?$/i.test(desc.trim());
  const isGenericDescB = /^Practical fixes for /i.test(desc.trim()) && /clear steps, quick checks/i.test(desc);
  const isGenericDescC = /^Troubleshooting guide for /i.test(desc.trim()) && /clear steps, quick checks/i.test(desc);

  // Check for bad title — not just lowercase start, but also:
  // - Contains lowercase "tv", "hdmi", "ps5", etc. that should be uppercase
  // - Doesn't have an em dash (hasn't been given a benefit suffix yet)
  const isLowercaseTitle = /^[a-z]/.test(title);
  const hasMissingCaps = /\b(tv|hdmi|ps5|hdr|4k|usb|wifi|earc|arc|cec|led|oled|avr|vrr|dns|dts)\b/.test(title) &&
    !/\b(TV|HDMI|PS5|HDR|4K|USB|WIFI|eARC|ARC|CEC|LED|OLED|AVR|VRR|DNS|DTS)\b/.test(title);
  const hasNoSuffix = !title.includes("—") && !title.includes(" - ") && !title.includes(":");
  const isBadTitle = isLowercaseTitle || (hasMissingCaps && hasNoSuffix);

  // Only process if it has at least one fixable issue
  if (!isBadTitle && !isGenericDescA && !isGenericDescB && !isGenericDescC) {
    skipped++;
    continue;
  }

  // Skip buying guides
  if (file.startsWith("best-")) {
    skipped++;
    continue;
  }

  // Skip already-fixed files
  const alreadyFixed = [
    "sonos-error-code-1008.mdx",
    "apple-tv-error-code-5051.mdx",
    "tcl-tv-earc-arc-not-working-with-soundbar.mdx",
    "multiple-brands-hdmi-no-signal-handshake-troubleshooting-guide.mdx",
    "apple-tv-fix-audio-delay.mdx",
    "how-to-sync-tv-with-soundbar-no-delay.mdx",
  ];
  if (alreadyFixed.includes(file)) {
    skipped++;
    continue;
  }

  let changed = false;
  const brand = data.brand || "";

  // Fix title
  if (isBadTitle) {
    const properTitle = titleCase(title) + getTitleSuffix(title);
    data.title = properTitle;
    changed = true;
  }

  // Fix description
  if (isGenericDescA || isGenericDescB || isGenericDescC) {
    data.description = generateDescription(title, data.slug || "", brand);
    changed = true;
  }

  // Fix word-split keywords
  const keywords = data.keywords || "";
  const isSpamKeywords = typeof keywords === "string" &&
    keywords.split(",").length > 3 &&
    keywords.split(",").every(k => k.trim().split(/\s+/).length <= 2);

  if (isSpamKeywords) {
    data.keywords = generateKeywords(data.title || title, data.slug || "", brand);
    changed = true;
  }

  // Fix generic coverAlt
  if (data.coverAlt && /setup or device$/i.test(data.coverAlt)) {
    data.coverAlt = `${brand || "Device"} troubleshooting — ${(data.title || title).replace(/ — .*$/, "")}`;
    changed = true;
  }

  if (changed) {
    const newContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, newContent, "utf8");
    fixed++;
    changes.push({
      file,
      title: data.title,
      desc: data.description?.substring(0, 80) + "...",
    });
  } else {
    skipped++;
  }
}

console.log(`\n✅ Fixed: ${fixed} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log(`\nChanged files:`);
changes.forEach(c => {
  console.log(`  ${c.file}`);
  console.log(`    Title: ${c.title}`);
  console.log(`    Desc:  ${c.desc}`);
});
