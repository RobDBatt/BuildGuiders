// scripts/check-mojibake.cjs
// Local-only helper to scan MDX files for the Unicode replacement character (� / \uFFFD).
// It DOES NOT modify files, only reports where issues are found.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

// Add any content directories you want scanned
const CONTENT_DIRS = [
  "content/articles",
  "content/posts",
  "content",
];

const TARGET_EXTS = new Set([".md", ".mdx"]);
const BAD_CHAR = "�"; // \uFFFD

function walk(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];

  /** @type {string[]} */
  const files = [];

  (function recurse(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(entryPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (TARGET_EXTS.has(ext)) {
          files.push(entryPath);
        }
      }
    }
  })(full);

  return files;
}

function findMojibakeInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(BAD_CHAR)) return [];

  const lines = content.split(/\r?\n/);
  /** @type {{ line: number; column: number; text: string }}[] */
  const hits = [];

  lines.forEach((line, idx) => {
    let searchIndex = line.indexOf(BAD_CHAR);
    while (searchIndex !== -1) {
      // Capture a short excerpt around the bad character
      const start = Math.max(0, searchIndex - 40);
      const end = Math.min(line.length, searchIndex + 40);
      const snippet = line.slice(start, end);

      hits.push({
        line: idx + 1,
        column: searchIndex + 1,
        text: snippet,
      });

      searchIndex = line.indexOf(BAD_CHAR, searchIndex + 1);
    }
  });

  return hits;
}

function main() {
  console.log("🔎 Scanning for mojibake (�) in MD/MDX files...\n");

  /** @type {{ file: string; hits: { line: number; column: number; text: string }[] }[]} */
  const results = [];

  for (const dir of CONTENT_DIRS) {
    const files = walk(dir);
    for (const file of files) {
      const hits = findMojibakeInFile(file);
      if (hits.length > 0) {
        results.push({ file, hits });
      }
    }
  }

  if (results.length === 0) {
    console.log("✅ No mojibake found. Your MDX looks clean.");
    return;
  }

  let totalHits = 0;

  for (const { file, hits } of results) {
    const rel = path.relative(ROOT, file);
    console.log(`\n📄 ${rel}`);
    hits.forEach((hit) => {
      totalHits++;
      console.log(
        `  - Line ${hit.line}, Col ${hit.column}: "${hit.text.replace(
          /\s+/g,
          " ",
        )}"`,
      );
    });
  }

  console.log(
    `\n⚠ Found ${totalHits} occurrence${totalHits === 1 ? "" : "s"} of "�" across ${
      results.length
    } file${results.length === 1 ? "" : "s"}.`,
  );
  console.log(
    "   Open those files and manually replace the mojibake with the correct punctuation or character.",
  );
}

main();

