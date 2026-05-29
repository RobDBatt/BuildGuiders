import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const PUBLIC_DIR = path.join(ROOT, "public");

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

function normalizeCoverPath(p) {
  if (!p || typeof p !== "string") return null;
  let cleaned = p.trim();
  if (!cleaned) return null;

  // Drop any query/hash, just in case
  cleaned = cleaned.split("?")[0].split("#")[0];

  // Ensure a single leading slash, so "/images/covers/foo.jpg" is the standard
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  return "/" + cleaned;
}

function main() {
  console.log("🔍 Checking article cover files...\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`ℹ️  No content/articles directory found at ${ARTICLES_DIR}.`);
    process.exit(0);
  }

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("ℹ️  No .mdx files found under content/articles.");
    process.exit(0);
  }

  const missing = [];
  const checked = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);

    const coverImage = data.coverImage || data.cover;
    const rel = normalizeCoverPath(coverImage);

    if (!rel) {
      // If no cover fields, skip here; schema validity is enforced elsewhere.
      continue;
    }

    const diskPath = path.join(PUBLIC_DIR, rel.replace(/^\//, ""));
    checked.push({ filePath, rel, diskPath });

    if (!fs.existsSync(diskPath)) {
      missing.push({
        filePath,
        urlPath: rel,
        diskPath,
      });
    }
  }

  console.log(`Articles with cover paths: ${checked.length}`);
  console.log(`Missing cover files:       ${missing.length}`);

  if (missing.length === 0) {
    console.log("\n✅ All referenced cover images exist under /public.");
    process.exit(0);
  }

  console.log("\n❌ Missing cover files:\n");
  for (const m of missing) {
    console.log(`- MDX:  ${m.filePath}`);
    console.log(`  URL:  ${m.urlPath}`);
    console.log(`  Disk: ${m.diskPath}`);
    console.log("");
  }

  process.exit(1);
}

main();

