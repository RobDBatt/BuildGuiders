// scripts/scan-amazon-links.mjs
// Scan MDX articles for amazon.com links and print a grouped report.
// This is informational only; no files are modified.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

function walkArticlesDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];

  function recurse(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
        files.push(fullPath);
      }
    }
  }

  recurse(dir);
  return files;
}

function findAmazonLinks(content) {
  /** @type {string[]} */
  const links = [];
  const urlRegex = /https?:\/\/[^\s)'"<>]*amazon\.com[^\s)'"<>]*/gi;
  let match;
  while ((match = urlRegex.exec(content))) {
    links.push(match[0]);
  }
  return links;
}

function main() {
  console.log("🔍 Scanning MDX for Amazon links (content/articles)...\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`No articles directory found at ${ARTICLES_DIR}`);
    process.exit(0);
  }

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("No .mdx files found under content/articles.");
    process.exit(0);
  }

  let totalLinks = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const links = findAmazonLinks(raw);
    if (links.length === 0) continue;

    const normalizedPath = file.replace(/\\/g, "/");
    console.log(`${normalizedPath}:`);
    for (const url of links) {
      totalLinks += 1;
      let notes = [];
      try {
        const parsed = new URL(url);
        const hasProductPath =
          parsed.pathname.includes("/dp/") ||
          parsed.pathname.includes("/gp/product/");
        if (!hasProductPath) {
          notes.push("⚠️ missing /dp/ or /gp/product/");
        }
        const tag = parsed.searchParams.get("tag");
        if (tag && tag !== "buildguiders-20") {
          notes.push(`⚠️ tag=${tag}, expected buildguiders-20`);
        }
      } catch {
        notes.push("⚠️ unable to parse URL");
      }

      if (notes.length > 0) {
        console.log(`  - ${url}  (${notes.join("; ")})`);
      } else {
        console.log(`  - ${url}`);
      }
    }
    console.log("");
  }

  if (totalLinks === 0) {
    console.log("No Amazon links found.");
  } else {
    console.log(`Total Amazon links found: ${totalLinks}`);
  }
  process.exit(0);
}

main();
