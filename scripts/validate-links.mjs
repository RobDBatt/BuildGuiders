// scripts/validate-links.mjs
// Validate internal article links and Amazon affiliate links in MDX content.
// Exits non-zero if internal links point to missing slugs.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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

function loadArticleSlugs(files) {
  /** @type {Set<string>} */
  const slugs = new Set();

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { data } = matter(raw);
    const fallback = path.basename(file).replace(/\.mdx$/i, "");
    const slug =
      typeof data.slug === "string" && data.slug.trim().length > 0
        ? data.slug.trim()
        : fallback;
    slugs.add(slug);
  }

  return slugs;
}

function findArticleLinks(content) {
  /** @type {{ href: string; slug: string }[]} */
  const results = [];
  const linkRegex = /\[[^\]]+\]\((\/[^)\s]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content))) {
    const href = match[1];
    if (href.startsWith("/articles/")) {
      const slug = href.replace(/^\/articles\//, "").split(/[?#]/)[0];
      if (slug) results.push({ href, slug });
    }
  }
  return results;
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
  console.log("🔍 Validating internal links and Amazon URLs in content/articles...\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`No articles directory found at ${ARTICLES_DIR}`);
    process.exit(0);
  }

  /* 
     Update to support root-relative URL structure.
     Rules:
     1. Links starting with /posts/ or /articles/ are ERRORS (Legacy).
     2. Links starting with / are checked against:
        - known article slugs
        - checklist of known static pages
        - category/brand pages match pattern
  */

  const knownStaticRoutes = new Set([
    "/",
    "/about",
    "/contact",
    "/troubleshooting",
    "/categories",
    "/brands",
    "/terms",
    "/privacy",
    "/articles", // The index page
    "/hdmi",
    "/apple-tv"
  ]);

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("No .mdx files found under content/articles.");
    process.exit(0);
  }

  const knownSlugs = loadArticleSlugs(files);
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    // Normalize backslashes to forward slashes
    const normalizedFile = file.replace(/\\/g, "/");
    // Split on content/articles to get relative path, handle both / and \ in original path just in case
    const normalizedPath = normalizedFile.split("/content/articles/")[1] || normalizedFile.split("content/articles/")[1] || path.basename(file);

    // Regex to find markdown links [text](href)
    // We strictly look for starting with / for internal links
    const linkRegex = /\[[^\]]+\]\((\/[^)\s]+)\)/g;

    let match;
    while ((match = linkRegex.exec(raw))) {
      const href = match[1];

      // 1. Check for Legacy Prefixes
      if (href.startsWith("/posts/") || href.startsWith("/articles/")) {
        // Exception: /articles IS valid if it is exactly /articles (index) or /articles?params
        if (href === "/articles" || href.startsWith("/articles?")) {
          // Valid index link
        } else {
          errors.push(`${normalizedPath}: Legacy link detected "${href}". Should be root-relative (e.g. /my-slug).`);
          continue;
        }
      }

      // 2. Validate Root-Relative Links
      // Clean query params and hashes
      const cleanPath = href.split("?")[0].split("#")[0];

      // Ignore valid valid static prefixes
      if (cleanPath.startsWith("/categories/") || cleanPath.startsWith("/brands/")) {
        continue;
      }

      if (knownStaticRoutes.has(cleanPath)) {
        continue;
      }

      // Check against known slugs (assuming /:slug format)
      const potentialSlug = cleanPath.substring(1); // remove leading /

      if (knownSlugs.has(potentialSlug)) {
        continue;
      }

      // If we got here, it's a 404 risk
      errors.push(`${normalizedPath}: Dead link detected "${href}". Slug "${potentialSlug}" not found in content.`);
    }

    // Amazon links warnings
    const amazonLinks = findAmazonLinks(raw);
    for (const url of amazonLinks) {
      try {
        const parsed = new URL(url);
        const tag = parsed.searchParams.get("tag");
        if (tag && tag !== "buildguiders-20") {
          warnings.push(
            `${normalizedPath}: Amazon tag is "${tag}" (expected buildguiders-20).`,
          );
        }
      } catch {
        // Warning covered by parsing logic usually
      }
    }
  }

  if (warnings.length > 0) {
    console.log("Warnings (Amazon Tags):");
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log("❌ Link Audit FAILED. Found dead or legacy internal links:");
    for (const err of errors) {
      console.log(`  ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ Audit Passed: Checked ${files.length} articles.`);
  console.log(`   - Verified validity of internal links against ${knownSlugs.size} active slugs.`);
  console.log(`   - No legacy /posts/ or /articles/ prefixes found.`);
  process.exit(0);
}

main();
