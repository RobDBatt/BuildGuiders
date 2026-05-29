// Fix YAML frontmatter parse errors blocking the accuracy audit.
// Two patterns handled:
//   1) Trailing stray ' after note: "..."
//        note: "Paid link: ..."'   ->   note: "Paid link: ..."
//   2) Unquoted title value containing a colon
//        title: Foo: Bar           ->   title: "Foo: Bar"
//
// Run: node scripts/fix-yaml-frontmatter.mjs [--dry-run]

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "content", "articles");
const dryRun = process.argv.includes("--dry-run");

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"));
let fixed1 = 0;
let fixed2 = 0;
const changed = [];

for (const file of files) {
  const fp = path.join(DIR, file);
  let text = fs.readFileSync(fp, "utf8");
  const original = text;

  const fmMatch = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!fmMatch) continue;
  const openDelim = fmMatch[1];
  let fm = fmMatch[2];
  const closeDelim = fmMatch[3];
  const fmStart = fmMatch.index + openDelim.length;
  const fmEnd = fmStart + fm.length;

  let newFm = fm;

  // Pattern 1: remove stray trailing ' right after a closing " at end of a value line.
  //   note: "...".'  -> note: "..."
  newFm = newFm.replace(/("[^"\n]*")\s*'\s*(\r?\n|$)/g, (_m, quoted, nl) => {
    fixed1++;
    return quoted + nl;
  });

  // Pattern 2: quote title/description/coverAlt values that contain an unquoted colon.
  // Preserve original line endings (CRLF vs LF) by operating per-line without split/join.
  const keysToGuard = ["title", "description", "coverAlt", "summary"];
  for (const k of keysToGuard) {
    const re = new RegExp(`^(${k}):\\s+(?!["'|>])(.+?)(\\r?)$`, "gm");
    newFm = newFm.replace(re, (full, key, value, cr) => {
      const v = value.trim();
      if (!v.includes(": ")) return full;
      if (v.startsWith('"') && v.endsWith('"')) return full;
      if (v.startsWith("'") && v.endsWith("'")) return full;
      fixed2++;
      const escaped = v.replace(/"/g, '\\"');
      return `${key}: "${escaped}"${cr}`;
    });
  }

  if (newFm !== fm) {
    text = text.slice(0, fmStart) + newFm + text.slice(fmEnd);
  }

  if (text !== original) {
    changed.push(file);
    if (!dryRun) fs.writeFileSync(fp, text, "utf8");
  }
}

console.log(
  `${dryRun ? "[DRY RUN] " : ""}Fixed ${changed.length} files. ` +
    `Pattern 1 (stray '): ${fixed1} lines. ` +
    `Pattern 2 (unquoted colon in title): ${fixed2} lines.`,
);
if (changed.length) {
  console.log("\nFiles changed:");
  for (const f of changed) console.log(`  ${f}`);
}
