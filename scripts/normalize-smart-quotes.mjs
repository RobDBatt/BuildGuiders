// scripts/normalize-smart-quotes.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const TARGET_DIRS = [
  path.join(ROOT, "content", "articles"),
  path.join(ROOT, "content", "snippets"),
];

const REPLACEMENTS = [
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€“", "–"],
  ["â€”", "—"],
];

async function walkMdxFiles(dir) {
  const results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await walkMdxFiles(full)));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
        results.push(full);
      }
    }
  } catch {
    // Ignore missing directories
  }
  return results;
}

function normalizeContent(text) {
  let updated = text;
  for (const [bad, good] of REPLACEMENTS) {
    updated = updated.split(bad).join(good);
  }
  return updated;
}

async function main() {
  const files = [];
  for (const dir of TARGET_DIRS) {
    files.push(...(await walkMdxFiles(dir)));
  }

  let changedCount = 0;

  for (const file of files) {
    const original = await fs.readFile(file, "utf8");
    const normalized = normalizeContent(original);
    if (normalized !== original) {
      await fs.writeFile(file, normalized, "utf8");
      changedCount += 1;
      const relative = path.relative(ROOT, file).replace(/\\/g, "/");
      console.log(`Fixed smart quotes in: ${relative}`);
    }
  }

  console.log(
    `Smart-quote normalization complete. Files updated: ${changedCount}`,
  );
}

main();

// Usage:
//   node scripts/normalize-smart-quotes.mjs
// Or via npm (see package.json script "fix:smartquotes").
