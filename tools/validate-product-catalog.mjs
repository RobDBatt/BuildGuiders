// tools/validate-product-catalog.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "lib", "productCatalog.ts");

const STRIP_TYPES = [
  /export type ProductCategory[\s\S]*?;\s*/m,
  /export type RecommendationProduct[\s\S]*?;\s*/m,
];

function transformCatalogSource(tsSource) {
  let code = tsSource;
  for (const regex of STRIP_TYPES) {
    code = code.replace(regex, "");
  }
  code = code.replace("export const RECOMMENDATION_PRODUCTS", "const RECOMMENDATION_PRODUCTS");
  code = code.replace(/export function (\w+)/g, "function $1");
  code = code.replace(
    /const RECOMMENDATION_PRODUCTS:\s*RecommendationProduct\[\]/,
    "const RECOMMENDATION_PRODUCTS",
  );
  code = code.replace(
    /function getProductById\(id: string\)/,
    "function getProductById(id)",
  );
  code = code.replace(
    /function buildAmazonUrl\(asin: string, amazonTag\?: string \| null\): string/,
    "function buildAmazonUrl(asin, amazonTag)",
  );
  code = code.replace(/: RecommendationProduct \| undefined/g, "");
  const startIndex = code.indexOf("const RECOMMENDATION_PRODUCTS");
  if (startIndex >= 0) {
    code = code.slice(startIndex);
  }
  code += "\nmodule.exports = { RECOMMENDATION_PRODUCTS, buildAmazonUrl, getProductById };";
  return code;
}

async function loadCatalog() {
  const source = await fs.readFile(CATALOG_PATH, "utf8");
  const js = transformCatalogSource(source);

  const context = {
    module: { exports: {} },
    exports: {},
    URL,
  };

  vm.createContext(context);
  vm.runInContext(js, context, { filename: CATALOG_PATH });

  const { RECOMMENDATION_PRODUCTS } = context.module.exports;
  return RECOMMENDATION_PRODUCTS ?? [];
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function main() {
  console.log("Validating catalog:", CATALOG_PATH);

  let products;
  try {
    products = await loadCatalog();
  } catch (err) {
    console.error("[ERROR] Failed to load catalog from lib/productCatalog.ts");
    console.error(err);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(products)) {
    console.error("[ERROR] RECOMMENDATION_PRODUCTS is not an array.");
    process.exitCode = 1;
    return;
  }

  const errors = [];
  const ids = new Set();
  const asins = new Set();

  for (const p of products) {
    const { id, asin, label, category } = p || {};

    if (!isNonEmptyString(id) || !isNonEmptyString(asin) || !isNonEmptyString(label) || !isNonEmptyString(category)) {
      errors.push("[ERROR] Missing required field on product: " + JSON.stringify(p));
    }

    if (isNonEmptyString(id)) {
      if (ids.has(id)) errors.push(`[ERROR] Duplicate id: ${id}`);
      ids.add(id);
    }

    if (isNonEmptyString(asin)) {
      if (asins.has(asin)) errors.push(`[ERROR] Duplicate asin: ${asin}`);
      asins.add(asin);
    }
  }

  console.log(`Products found: ${products.length}`);

  if (errors.length > 0) {
    for (const msg of errors) {
      console.error(msg);
    }
    console.error(`Catalog validation FAILED with ${errors.length} error(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Catalog validation OK. Products: ${products.length}.`);
}

await main();

// Usage:
//   node tools/validate-product-catalog.mjs
// or via npm:
//   npm run check:catalog
