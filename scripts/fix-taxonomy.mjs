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

function normalizeCategoryValue(category) {
  if (typeof category !== "string") return category;

  const raw = category.trim();
  if (!raw) return raw;

  const lower = raw.toLowerCase();

  let normalized = raw;
  if (lower === "tv" || lower === "tvs") {
    normalized = "tvs";
  }

  return normalized;
}

function main() {
  console.log("🛠  Normalizing article categories in content/articles...\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`ℹ️  No content/articles directory found at ${ARTICLES_DIR}.`);
    process.exit(0);
  }

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("ℹ️  No .mdx files found under content/articles.");
    process.exit(0);
  }

  let changedCount = 0;

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};

    const original = typeof data.category === "string" ? data.category : "";
    const normalized = normalizeCategoryValue(data.category);

    if (normalized !== original) {
      data.category = normalized;

      const newContent = matter.stringify(parsed.content, data);
      fs.writeFileSync(filePath, newContent, "utf8");

      changedCount += 1;
      console.log(
        `✔ Updated category in ${path.relative(ROOT, filePath)}: "${original}" → "${normalized}"`,
      );
    }
  }

  if (changedCount === 0) {
    console.log("\n✅ No category changes were necessary.");
  } else {
    console.log(`\n✅ Done. Updated categories in ${changedCount} file(s).`);
  }
}

main();

