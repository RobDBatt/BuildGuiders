import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentRoot = new URL("../content/articles", import.meta.url);
const MIN_PER_PAIR = 2;

async function walkDir(dirUrl) {
  const entries = await fs.readdir(dirUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dirUrl);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(entryUrl)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
      files.push(entryUrl);
    }
  }

  return files;
}

function normalize(value, fallback = "(none)") {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : fallback;
}

async function loadArticleMeta(fileUrl) {
  const raw = await fs.readFile(fileUrl, "utf8");
  const { data } = matter(raw);

  const published =
    typeof data.published === "boolean" ? data.published : true;
  if (!published) return null;

  const categorySlug = normalize(data.category);
  const brandSlug = normalize(data.brand);

  return { categorySlug, brandSlug };
}

function increment(map, category, brand) {
  if (!map[category]) map[category] = {};
  if (!map[category][brand]) map[category][brand] = 0;
  map[category][brand] += 1;
}

function sortKeys(obj) {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b));
}

async function main() {
  try {
    const files = await walkDir(contentRoot);
    const counts = {};
    const totalByCategory = {};
    const totalByBrand = {};

    for (const fileUrl of files) {
      const meta = await loadArticleMeta(fileUrl);
      if (!meta) continue;
      const { categorySlug, brandSlug } = meta;

      increment(counts, categorySlug, brandSlug);
      totalByCategory[categorySlug] = (totalByCategory[categorySlug] ?? 0) + 1;
      totalByBrand[brandSlug] = (totalByBrand[brandSlug] ?? 0) + 1;
    }

    const categories = sortKeys(totalByCategory);
    const brands = sortKeys(totalByBrand);

    console.log("Category coverage report (published articles only)");
    console.log("==================================================");
    console.log("");
    console.log("Categories:");
    for (const cat of categories) {
      console.log(`  - ${cat}`);
    }
    console.log("");
    console.log("Per-category breakdown:");
    for (const cat of categories) {
      const brandMap = counts[cat] || {};
      const brandKeys = sortKeys(brandMap);
      const catTotal = totalByCategory[cat] ?? 0;
      console.log("");
      console.log(`[${cat}] (total: ${catTotal})`);
      for (const brand of brandKeys) {
        console.log(`  - ${brand}: ${brandMap[brand]}`);
      }
    }

    console.log("");
    console.log("Weak spots (target per category/brand pair):", MIN_PER_PAIR);
    let gaps = 0;
    for (const cat of categories.filter((c) => c !== "(none)")) {
      const brandMap = counts[cat] || {};
      const brandKeys = sortKeys(brandMap);
      for (const brand of brandKeys) {
        if (brand === "(none)") continue;
        const count = brandMap[brand];
        if (count < MIN_PER_PAIR) {
          gaps += 1;
          console.log(
            `GAP: category="${cat}", brand="${brand}" has ${count} articles (target: ${MIN_PER_PAIR})`,
          );
        }
      }
    }
    if (gaps === 0) {
      console.log(
        `No gaps under MIN_PER_PAIR=${MIN_PER_PAIR}. Coverage is at or above target.`,
      );
    }
  } catch (err) {
    console.error("Error generating coverage report:", err);
    process.exitCode = 1;
  }
}

await main();
