// scripts/bulk-publish.mjs
// Sets published: true on every article that has published: false.
// Usage:
//   node scripts/bulk-publish.mjs           - publish all drafts
//   node scripts/bulk-publish.mjs --dry-run - preview without writing

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) console.log("DRY RUN - no files will be written.");

const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));

let published = 0;
let alreadyPublished = 0;

for (const file of files) {
  const filePath = path.join(ARTICLES_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.includes("published: false")) {
    alreadyPublished++;
    continue;
  }
  const updated = raw.replace("published: false", "published: true");
  if (DRY_RUN) {
    console.log("  Would publish: " + file);
    published++;
  } else {
    fs.writeFileSync(filePath, updated, "utf8");
    console.log("Published: " + file);
    published++;
  }
}

console.log("Summary: " + published + " published, " + alreadyPublished + " skipped.");
