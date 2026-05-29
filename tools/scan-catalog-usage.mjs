// tools/scan-catalog-usage.mjs
// Scan MDX content to see which catalog products are actually referenced.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const CATALOG_PATH = path.join(ROOT, "lib", "productCatalog.ts");
const CONTENT_ROOT = path.join(ROOT, "content");

/**
 * Simple helper to read all files with a given extension under a root directory.
 */
async function listFilesRecursive(rootDir, ext) {
  const result = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith(ext)) {
        result.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return result;
}

/**
 * Lightweight parser for lib/productCatalog.ts.
 *
 * We do NOT assume a specific outer object shape.
 * We just look for repeated blocks with id/label/asin/url.
 */
async function loadProductCatalog() {
  const src = await fs.readFile(CATALOG_PATH, "utf8");

  const entries = [];

  // Match blocks like "<propKey>: { ... }"
  const blockRegex = /([a-zA-Z0-9_]+)\s*:\s*{([\s\S]*?)}\s*,?/g;
  let blockMatch;

  while ((blockMatch = blockRegex.exec(src)) !== null) {
    const propKey = blockMatch[1];
    const body = blockMatch[2];

    const idMatch = body.match(/id\s*:\s*["'`]([^"'`]+)["'`]/);
    const labelMatch = body.match(/label\s*:\s*["'`]([^"'`]+)["'`]/);
    const asinMatch = body.match(/asin\s*:\s*["'`]([^"'`]+)["'`]/);
    const urlMatch = body.match(/url\s*:\s*["'`]([^"'`]+)["'`]/);

    if (!idMatch || !labelMatch || !asinMatch || !urlMatch) {
      // Not a full product entry; skip.
      continue;
    }

    const id = idMatch[1];
    const label = labelMatch[1];
    const asin = asinMatch[1];
    const url = urlMatch[1];

    entries.push({
      key: propKey,
      id,
      label,
      asin,
      url,
    });
  }

  if (entries.length === 0) {
    console.warn(
      "[scan-catalog-usage] No product entries detected in productCatalog.ts; skipping usage scan."
    );
  }

  return entries;
}

/**
 * Count occurrences of each product id across all MDX files.
 * We just search for the id as a plain substring, which is robust
 * across different usages like <GgProduct id="hdmi_21_short_6ft" />.
 */
async function scanUsage(products) {
  const mdxFiles = await listFilesRecursive(CONTENT_ROOT, ".mdx");

  const usage = new Map();
  for (const p of products) {
    usage.set(p.id, { count: 0, files: [] });
  }

  for (const file of mdxFiles) {
    const text = await fs.readFile(file, "utf8");

    for (const p of products) {
      if (text.includes(p.id)) {
        const entry = usage.get(p.id);
        entry.count += 1;
        entry.files.push(
          path.relative(ROOT, file).replace(/\\/g, "/")
        );
      }
    }
  }

  return { usage, mdxFilesCount: mdxFiles.length };
}

async function main() {
  try {
    const products = await loadProductCatalog();

    if (!products || products.length === 0) {
      console.log(
        "[scan-catalog-usage] No products parsed; treating as informational only."
      );
      return;
    }

    const { usage, mdxFilesCount } = await scanUsage(products);
    const totalProducts = products.length;

    console.log(
      `Scanning ${mdxFilesCount} MDX files for ${totalProducts} catalog ids...\n`
    );

    for (const p of products) {
      const entry = usage.get(p.id) || { count: 0, files: [] };
      console.log(`id: ${p.id}`);
      console.log(`  label: ${p.label}`);
      console.log(`  asin: ${p.asin}`);
      console.log(`  url: ${p.url}`);
      console.log(`  usageCount: ${entry.count}`);

      if (entry.count > 0) {
        console.log("  files:");
        for (const f of entry.files) {
          console.log(`    - ${f}`);
        }
      }

      console.log(); // blank line between products
    }

    console.log(
      `Catalog usage scan complete. Products: ${totalProducts}. Any product with usageCount = 0 is not referenced in MDX.`
    );

    const unused = products.filter(
      (p) => (usage.get(p.id) || { count: 0 }).count === 0
    );
    if (unused.length > 0) {
      console.log("Unused products:");
      for (const p of unused) {
        console.log(` - ${p.id} (${p.label})`);
      }
    } else {
      console.log("All products are referenced at least once in MDX.");
    }
  } catch (err) {
    console.error("[ERROR] scan-catalog-usage failed:", err);
    // Do not block deployment; treat as informational.
    process.exitCode = 0;
  }
}

main();

