import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const articlesDir = path.join(repoRoot, "content", "articles");

const batchSize = Number(process.argv[2]) || 5;

function isErrorCodeTag(tags) {
  if (!tags) return false;
  const arr = Array.isArray(tags) ? tags : [tags];
  return arr.some((t) =>
    String(t).toLowerCase().includes("error-code"),
  );
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(full);
    }
  }

  return files;
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  console.log(
    `Drip: scanning for unpublished error-code articles (batch size ${batchSize})...`,
  );

  const allFiles = await walk(articlesDir);

  const candidates = [];
  for (const file of allFiles) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};

    if (data.published === false && isErrorCodeTag(data.tags)) {
      candidates.push({ file, data, body: parsed.content });
    }
  }

  if (candidates.length === 0) {
    console.log("No unpublished error-code articles found. Nothing to drip.");
    return;
  }

  candidates.sort((a, b) => a.file.localeCompare(b.file));

  const toPublish = candidates.slice(0, batchSize);

  console.log(`Publishing ${toPublish.length} error-code article(s):`);
  const date = todayStr();

  for (const item of toPublish) {
    const { file, data, body } = item;
    data.published = true;
    if (!data.date) {
      data.date = date;
    }

    const updated = matter.stringify(body, data);
    await fs.writeFile(file, updated, "utf8");
    console.log(
      `  - ${path.relative(repoRoot, file)} (date=${data.date})`,
    );
  }

  console.log("Drip complete.");
}

main().catch((err) => {
  console.error("drip-error-fixes.mjs failed:", err);
  process.exit(1);
});
