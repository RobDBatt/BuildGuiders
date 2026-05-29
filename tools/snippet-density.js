const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "content", "articles");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && full.toLowerCase().endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

const mdxFiles = walk(ROOT);
const results = [];

for (const file of mdxFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const parts = raw.split(/^---\s*$/m);
  let body = raw;
  if (parts.length >= 3) {
    body = parts.slice(2).join("---");
  }

  const wordCount = (body.match(/\b\w+\b/g) || []).length;
  const snippets = (body.match(/<GG\w+Recommendation\s*\/>/g) || []).length;
  const slug = path.basename(file).replace(/\.mdx$/, "");

  results.push({ slug, file, wordCount, snippets });
}

results.sort((a, b) => a.slug.localeCompare(b.slug));

const highlight = results.filter(
  (r) => r.snippets > 3 || (r.snippets > 2 && r.wordCount < 800),
);

const lines = [
  "# Snippet density report",
  "slug,wordCount,snippetCount",
  ...results.map((r) => `${r.slug},${r.wordCount},${r.snippets}`),
  "",
  "# Highlighted (snippetCount>3 or snippetCount>2 and wordCount<800)",
  ...highlight.map((r) => `${r.slug},${r.wordCount},${r.snippets}`),
];

fs.mkdirSync("tools", { recursive: true });
fs.writeFileSync(path.join("tools", "snippet-density-report.txt"), lines.join("\n"));

console.log("Report written with", results.length, "entries. Highlights:", highlight.length);
