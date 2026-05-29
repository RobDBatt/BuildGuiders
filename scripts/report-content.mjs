import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

function walkArticlesDir(dir) {
  if (!fs.existsSync(dir)) return [];

  /** @type {string[]} */
  const files = [];

  function recurse(current) {
    const name = path.basename(current);
    // Skip known backup/legacy directories under content
    if (name.startsWith("articles.bak-") || name === "_legacy-backups") {
      return;
    }

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

function normalizeBrand(b) {
  if (!b || typeof b !== "string") return "";
  return b.trim().toLowerCase();
}

function normalizeCategory(c) {
  if (!c || typeof c !== "string") return "";
  return c.trim().toLowerCase();
}

function main() {
  console.log("📊 Content coverage report (articles):\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`ℹ️  No content/articles directory found at ${ARTICLES_DIR}.`);
    process.exit(0);
  }

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("ℹ️  No .mdx files found under content/articles.");
    process.exit(0);
  }

  const brandCounts = new Map();
  const categoryCounts = new Map();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);

    const b = normalizeBrand(data.brand);
    const c = normalizeCategory(data.category);

    if (b) {
      brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
    }

    if (c) {
      categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
    }
  }

  console.log("Brands:");
  if (brandCounts.size === 0) {
    console.log("  (no brand values set)");
  } else {
    const sortedBrands = Array.from(brandCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [slug, count] of sortedBrands) {
      const label =
        slug === "lg"
          ? "LG"
          : slug
              .split(/[-\s]+/)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
      console.log(`  ${label}: ${count}`);
    }
  }

  console.log("\nCategories:");
  if (categoryCounts.size === 0) {
    console.log("  (no category values set)");
  } else {
    const sortedCats = Array.from(categoryCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [slug, count] of sortedCats) {
      console.log(`  ${slug}: ${count}`);
    }
  }

  console.log("");
}

main();

