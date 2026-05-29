import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

const ENCODING_FIXES = [
  { bad: /â€“/g, good: "–" },
  { bad: /â€”/g, good: "—" },
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

function stripDuplicateH1(body, title) {
  const lines = body.split(/\r?\n/);
  let firstContentIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "") {
      firstContentIdx = i;
      break;
    }
  }
  if (firstContentIdx === -1) return body;

  const firstLine = lines[firstContentIdx].trim();
  const expectedHash = `# ${title}`;
  const expectedHash2 = `## ${title}`;
  if (firstLine === expectedHash || firstLine === expectedHash2) {
    const removeCount =
      firstContentIdx + 1 < lines.length && lines[firstContentIdx + 1].trim() === ""
        ? 2
        : 1;
    lines.splice(firstContentIdx, removeCount);
  }
  return lines.join("\n");
}

function normalizeForHash(text) {
  return text.replace(/\s+/g, " ").toLowerCase().trim();
}

function wordCount(text) {
  const matches = text.match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

async function main() {
  const files = await walk(ARTICLES_DIR);

  const records = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    parsed.content = stripDuplicateH1(parsed.content, parsed.data.title || "");

    let body = parsed.content;
    for (const fix of ENCODING_FIXES) {
      body = body.replace(fix.bad, fix.good);
    }

    const wc = wordCount(body);
    const hasH2 = /(^|\n)##\s+/.test(body);
    const bodyHash = crypto
      .createHash("sha1")
      .update(normalizeForHash(body))
      .digest("hex");

    records.push({
      file,
      slug: parsed.data.slug || path.basename(file, ".mdx"),
      data: parsed.data,
      body,
      hash: bodyHash,
      wordCount: wc,
      hasH2,
    });
  }

  // Detect duplicates
  const byHash = new Map();
  for (const rec of records) {
    if (!byHash.has(rec.hash)) byHash.set(rec.hash, []);
    byHash.get(rec.hash).push(rec);
  }

  let duplicateUnpublished = 0;
  for (const group of byHash.values()) {
    if (group.length <= 1) continue;
    const eligible = group.filter((r) => r.wordCount > 200);
    if (eligible.length <= 1) continue;
    const [canonical, ...dupes] = eligible;
    for (const dup of dupes) {
      dup.data.published = false;
      dup.body = "<!-- Placeholder removed: content duplicated from another article. -->";
      duplicateUnpublished += 1;
    }
  }

  // Quality gate for published
  let autoUnpublished = 0;
  for (const rec of records) {
    if (rec.data.published === false) continue;
    if (rec.wordCount < 300 || !rec.hasH2) {
      rec.data.published = false;
      rec.body = `<!-- Unpublished automatically: content too short or incomplete. -->\n\n${rec.body}`;
      autoUnpublished += 1;
    }
  }

  // Write back
  for (const rec of records) {
    const next = matter.stringify(rec.body, rec.data);
    await fs.writeFile(rec.file, next, "utf8");
  }

  console.log("Repair complete.");
  console.log(`Total articles processed: ${records.length}`);
  console.log(`Duplicate bodies unpublished: ${duplicateUnpublished}`);
  console.log(`Short/incomplete unpublished: ${autoUnpublished}`);
}

main().catch((err) => {
  console.error("repair-mdx failed:", err);
  process.exitCode = 1;
});
