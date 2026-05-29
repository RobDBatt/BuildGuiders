// scripts/strip-cover-frontmatter.mjs
//
// Removes `coverImage:` and `coverAlt:` keys from MDX frontmatter across the
// content directory. Now that articles use the auto-generated /og/[slug] route
// for social cards and a typographic hero on-page, those fields are unused.
//
// Surgical regex pass — only touches lines inside the leading frontmatter
// block, so article body text is never modified.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const TARGET_KEYS = ["coverImage", "coverAlt"];

async function walk(dir, files = []) {
  const { readdirSync, statSync } = await import("node:fs");
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (entry.isFile() && extname(entry.name) === ".mdx") {
      files.push(full);
    }
  }
  return files;
}

function stripFromFrontmatter(source) {
  if (!source.startsWith("---")) return { changed: false, output: source };

  const closeIdx = source.indexOf("\n---", 3);
  if (closeIdx === -1) return { changed: false, output: source };

  const fmEnd = closeIdx + 4; // include the closing ---
  const frontmatter = source.slice(0, fmEnd);
  const body = source.slice(fmEnd);

  const lines = frontmatter.split(/\r?\n/);
  const filtered = [];
  let removed = 0;

  for (const line of lines) {
    const match = line.match(/^(\s*)([A-Za-z0-9_]+):/);
    if (match && TARGET_KEYS.includes(match[2])) {
      removed++;
      continue;
    }
    filtered.push(line);
  }

  if (removed === 0) return { changed: false, output: source };
  return { changed: true, output: filtered.join("\n") + body, removed };
}

async function main() {
  const root = join(process.cwd(), "content");
  const files = await walk(root);

  let changed = 0;
  let skipped = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const { changed: wasChanged, output, removed } = stripFromFrontmatter(source);
    if (wasChanged) {
      await writeFile(file, output, "utf8");
      changed++;
      console.log(`  stripped ${removed} key(s): ${file}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${changed} files updated, ${skipped} unchanged.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
