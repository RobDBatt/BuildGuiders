#!/usr/bin/env node
// scripts/fix-cover-images.mjs
// Fixes invalid coverImage references and removes the cover field from all articles.
// Usage:
//   node scripts/fix-cover-images.mjs              (apply changes)
//   node scripts/fix-cover-images.mjs --dry-run    (preview only)

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const PUBLIC_DIR = path.join(ROOT, "public");
const DRY_RUN = process.argv.includes("--dry-run");

// ── Canonical category → coverImage mapping ──────────────────────────────────
export const CATEGORY_COVER_MAP = {
  tvs: "/images/gg/gg-tv-general.png",
  "streaming-devices": "/images/gg/gg-streaming.png",
  "gaming-consoles": "/images/gg/gg-gaming-console.png",
  "audio-speakers": "/images/gg/gg-soundbar.png",
  soundbars: "/images/gg/gg-soundbar.png",
  "speakers-subwoofers": "/images/gg/gg-soundbar.png",
  "receivers-amps": "/images/gg/gg-receiver.png",
  hdmi: "/images/gg/gg-hdmi-cables.png",
  "cables-connections": "/images/gg/gg-hdmi-cables.png",
  remotes: "/images/gg/gg-smart-home-device.png",
  "smart-home-security": "/images/gg/gg-smart-home-device.png",
  "smart-locks": "/images/gg/gg-smart-home-device.png",
  "climate-control": "/images/gg/gg-smart-home-device.png",
  "network-gear": "/images/gg/gg-smart-home-device.png",
  troubleshooting: "/images/gg/gg-gaming-console.png",
};

// ── Known bad → correct image path fixes ─────────────────────────────────────
const IMAGE_FIX_MAP = {
  "/images/gg/gg-audio-speakers.png": "/images/gg/gg-soundbar.png",
  "/images/gg/gg-receivers-amps.png": "/images/gg/gg-receiver.png",
  "/images/gg/gg-tvs.png": "/images/gg/gg-tv-general.png",
  "/images/gg/gg-hdmi.png": "/images/gg/gg-hdmi-cables.png",
  "/images/gg/gg-gaming-consoles.png": "/images/gg/gg-gaming-console.png",
  "/images/gg/gg-streaming-devices.png": "/images/gg/gg-streaming.png",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "").trim();
}

function imageExists(imgPath) {
  return fs.existsSync(path.join(PUBLIC_DIR, imgPath));
}

/** Pick the correct coverImage for an article. */
function resolveCorrectCover(currentCover, category) {
  // 1. Direct fix for known bad paths
  if (currentCover && IMAGE_FIX_MAP[currentCover]) {
    return IMAGE_FIX_MAP[currentCover];
  }

  // 2. If current image is in /images/covers/ (wrong field), replace with generic
  if (currentCover && currentCover.startsWith("/images/covers/")) {
    return CATEGORY_COVER_MAP[category] || "/images/gg/gg-tv-general.png";
  }

  // 3. If current image exists on disk, keep it
  if (currentCover && imageExists(currentCover)) {
    return currentCover;
  }

  // 4. Use category mapping
  if (category && CATEGORY_COVER_MAP[category]) {
    return CATEGORY_COVER_MAP[category];
  }

  // 5. Fallback
  return "/images/gg/gg-tv-general.png";
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (DRY_RUN) console.log("=== DRY RUN (no files will be changed) ===\n");

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  let totalFixed = 0;
  let coverImageFixed = 0;
  let coverRemoved = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Normalize line endings to \n for processing, remember original style
    const useCRLF = content.includes("\r\n");
    const normalized = content.replace(/\r\n/g, "\n");

    // Split into frontmatter and body
    const fmMatch = normalized.match(/^(---\n)([\s\S]*?)\n(---)([\s\S]*)$/);
    if (!fmMatch) {
      console.log(`SKIP (no frontmatter): ${file}`);
      continue;
    }

    const [, open, yaml, close, body] = fmMatch;
    const lines = yaml.split("\n");

    // ── Parse relevant fields from frontmatter lines ──
    let category = null;
    let coverImageIdx = -1;
    let coverImageValue = null;
    let coverIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // category: "tvs"  or  category: tvs
      const catMatch = line.match(/^category:\s*(.+)$/);
      if (catMatch) category = stripQuotes(catMatch[1]);

      // coverImage: /images/gg/gg-tv-general.png
      const ciMatch = line.match(/^coverImage:\s*(.+?)(\s*#.*)?$/);
      if (ciMatch) {
        coverImageIdx = i;
        coverImageValue = stripQuotes(ciMatch[1]);
      }

      // cover: "/images/covers/slug.jpg"  (top-level only, not coverImage/coverAlt)
      if (/^cover:\s/.test(line) && !/^cover(Image|Alt):/.test(line)) {
        coverIdx = i;
      }
    }

    let changed = false;

    // ── Fix coverImage ──
    const correctCover = resolveCorrectCover(coverImageValue, category);
    if (coverImageValue !== correctCover && coverImageIdx >= 0) {
      console.log(
        `FIX coverImage: ${file}\n    ${coverImageValue} -> ${correctCover}`
      );
      lines[coverImageIdx] = `coverImage: ${correctCover}`;
      changed = true;
      coverImageFixed++;
    }

    // ── Remove cover field ──
    if (coverIdx >= 0) {
      if (!changed) console.log(`REMOVE cover: ${file}`);
      else console.log(`    + removing cover field`);
      lines.splice(coverIdx, 1);
      changed = true;
      coverRemoved++;
    }

    if (!changed) continue;

    totalFixed++;
    if (DRY_RUN) continue;

    let newContent = open + lines.join("\n") + "\n" + close + body;
    if (useCRLF) newContent = newContent.replace(/\n/g, "\r\n");
    fs.writeFileSync(filePath, newContent, "utf8");
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Total articles scanned: ${files.length}`);
  console.log(`Articles modified:      ${totalFixed}`);
  console.log(`  coverImage corrected: ${coverImageFixed}`);
  console.log(`  cover field removed:  ${coverRemoved}`);
  if (DRY_RUN) console.log(`\n(dry run — no files were changed)`);
}

main();
