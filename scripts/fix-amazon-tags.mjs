#!/usr/bin/env node
/**
 * fix-amazon-tags.mjs
 *
 * Bulk-add the BuildGuiders Amazon affiliate tag to every amazon.com URL in
 * content/articles/*.mdx that doesn't already have one.
 *
 * Idempotent: URLs that already carry tag=buildguiders-20 are left alone.
 *
 * Run from project root:
 *   node scripts/fix-amazon-tags.mjs
 *
 * IMPORTANT: This script handles two URL contexts:
 *   1) URLs in YAML frontmatter (bare URLs on their own line)
 *   2) URLs inside markdown links: [text](url)
 *
 * For markdown links, the URL is bounded by the closing `)`, so parens
 * inside the URL would prematurely terminate. We therefore use two
 * separate passes, each with the right boundary set.
 */

import fs from "node:fs";
import path from "node:path";

const TAG = "buildguiders-20";
const ARTICLES_DIR = path.resolve("content/articles");

// Pass 1: URLs inside markdown links — bounded by `)`. Anything after the
// last `)` belongs to the markdown, not the URL.
const MD_LINK_REGEX = /\(https?:\/\/www\.amazon\.com[^)\s"']*\)/gi;

// Pass 2: bare URLs (YAML frontmatter etc.). These run to whitespace or quote.
// We do NOT exclude `)` here so we don't truncate URLs that legitimately
// contain literal parens.
const BARE_URL_REGEX = /https?:\/\/www\.amazon\.com[^\s"'<>]+/gi;

function ensureTag(url) {
  if (/[?&]tag=/i.test(url)) return url; // already tagged
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "tag=" + TAG;
}

function processFile(filePath) {
  const orig = fs.readFileSync(filePath, "utf8");
  let added = 0;

  // Pass 1: markdown links
  let updated = orig.replace(MD_LINK_REGEX, (full) => {
    const url = full.slice(1, -1); // strip surrounding parens
    const fixed = ensureTag(url);
    if (fixed !== url) added += 1;
    return "(" + fixed + ")";
  });

  // Pass 2: bare URLs (skip ones already inside markdown links — those were
  // handled above and now have tags). We re-check for tag presence.
  updated = updated.replace(BARE_URL_REGEX, (url) => {
    // Strip trailing punctuation that's almost certainly not part of the URL
    const m = url.match(/^(.*?)([.,;:!?\)]+)$/);
    const cleanUrl = m ? m[1] : url;
    const trailing = m ? m[2] : "";
    const fixed = ensureTag(cleanUrl);
    if (fixed !== cleanUrl) added += 1;
    return fixed + trailing;
  });

  if (updated !== orig) fs.writeFileSync(filePath, updated);
  return added;
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(`Articles directory not found: ${ARTICLES_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => path.join(ARTICLES_DIR, f));

  let totalUrls = 0;
  let totalFiles = 0;
  for (const f of files) {
    const added = processFile(f);
    if (added > 0) {
      totalUrls += added;
      totalFiles += 1;
    }
  }
  console.log(`Tagged ${totalUrls} Amazon URL(s) across ${totalFiles} article file(s).`);
}

main();
