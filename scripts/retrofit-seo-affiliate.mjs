#!/usr/bin/env node
// Retrofit existing MDX frontmatter for SEO/affiliate compliance without touching bodies.
// - Adds/normalizes description (<=160 chars), keywords, coverAlt
// - Guarantees products array, normalizes Amazon URLs to /dp/ASIN/?tag=buildguiders-20 when possible
// - Uses a small local catalog (optional). If missing, falls back to the HDMI cable.
// - Preserves existing slug/title/brand/category/published and body content.
// - Skips _legacy directories.

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

const TAG = "buildguiders-20";
const PRODUCT_CATALOG_PATH = path.join(ROOT, "scripts", "affiliate-products.json");
const PRESERVE_EXISTING_AMAZON_TAG = false;

// Known-safe fallback (current default)
const FALLBACK_ASIN = "B0BYP2F7WT";
const fallbackProduct = {
  name: "Certified Ultra High Speed HDMI Cable",
  description: "Certified HDMI 2.1 cable to stabilize HDMI/eARC links for common A/V fixes.",
  asin: FALLBACK_ASIN,
  note: "Paid link: BuildGuiders may earn a commission at no extra cost to you.",
};

// ---------- Helpers ----------
const truncate = (s, max = 160) => {
  const str = String(s || "").trim();
  return str.length > max ? `${str.slice(0, max - 1).trim()}…` : str;
};

const buildKeywords = (parts) => {
  const base = parts.filter(Boolean).join(" ").toLowerCase();
  const tokens = Array.from(
    new Set(
      base
        .split(/[^a-z0-9+]+/i)
        .filter((t) => t && t.length > 2)
        .slice(0, 14),
    ),
  );
  return tokens.join(", ");
};

// Extract ASIN from common Amazon URL patterns
function extractAsin(url) {
  if (!url || typeof url !== "string") return null;
  const m =
    url.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i) ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i) ||
    url.match(/\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

function canonicalAmazonDpUrl(asin, tag = TAG) {
  return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
}

function ensurePaidLinkNote(note) {
  const required = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";
  if (!note || typeof note !== "string") return required;
  return note.includes("Paid link") ? note : required;
}

// Normalize product URL to canonical dp+tag when possible
// Rules:
// - If url missing/empty: use fallbackUrl
// - If non-Amazon: return as-is (never overwrite with fallback)
// - If Amazon + ASIN: canonicalize and apply tag (or preserve if configured)
// - If Amazon without ASIN: keep path, apply tag (or preserve if configured)
function normalizeProductUrl(url, fallbackUrl) {
  if (!url || typeof url !== "string") return fallbackUrl || url;

  const isAmazon = url.includes("amazon.com");
  if (!isAmazon) return url;

  const asin = extractAsin(url);
  if (asin) {
    if (PRESERVE_EXISTING_AMAZON_TAG) return canonicalAmazonDpUrl(asin);
    return canonicalAmazonDpUrl(asin, TAG);
  }

  const base = url.replace(/\?.*$/, "").replace(/\/$/, "");
  if (PRESERVE_EXISTING_AMAZON_TAG) return url;
  return `${base}/?tag=${TAG}`;
}

// Score a catalog item based on topic hints (title/category/brand/tags)
function scoreCatalogItem(item, topicText) {
  const keywords = Array.isArray(item.match) ? item.match : [];
  if (!keywords.length) return 0;
  let score = 0;
  for (const k of keywords) {
    if (!k) continue;
    const needle = String(k).toLowerCase();
    if (topicText.includes(needle)) score += 3;
  }
  return score;
}

async function loadCatalog() {
  try {
    const raw = await fs.readFile(PRODUCT_CATALOG_PATH, "utf8");
    const json = JSON.parse(raw);
    const items = Array.isArray(json?.items) ? json.items : [];
    const fallbackKey = typeof json?.fallbackKey === "string" ? json.fallbackKey : null;
    return { items, fallbackKey };
  } catch {
    return { items: [], fallbackKey: null };
  }
}

function pickDefaultProduct(catalog, topicText) {
  const items = catalog?.items || [];
  if (!items.length) return null;

  let best = null;
  let bestScore = 0;

  for (const item of items) {
    const score = scoreCatalogItem(item, topicText);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore >= 3) return best;

  if (catalog?.fallbackKey) {
    const fb = items.find((x) => x.key === catalog.fallbackKey);
    if (fb) return fb;
  }

  return null;
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_legacy")) continue;
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      yield full;
    }
  }
}

async function retrofit(file, catalog) {
  const raw = await fs.readFile(file, "utf8");
  const parsed = matter(raw);
  const data = parsed.data || {};

  const title = data.title || "";
  const brand = data.brand || "";
  const category = data.category || "";
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const topicText = [title, brand, category, ...tags].filter(Boolean).join(" ").toLowerCase();

  if (!data.description || typeof data.description !== "string") {
    const base = title || data.slug || "this issue";
    data.description = truncate(
      `Practical fixes for ${base}: quick checks, clear steps, and settings to stabilize your setup.`,
    );
  } else {
    data.description = truncate(data.description);
  }

  if (!data.keywords) {
    data.keywords = buildKeywords([title, brand, category, ...tags]);
  } else if (Array.isArray(data.keywords)) {
    data.keywords = buildKeywords([...data.keywords, title, brand, category, ...tags]);
  } else if (typeof data.keywords === "string") {
    data.keywords = data.keywords.trim();
  }

  if (!data.coverAlt) {
    data.coverAlt = `${title || brand || "Device"} setup or device`;
  }

  const defaultFromCatalog = pickDefaultProduct(catalog, topicText);
  const defaultProduct = defaultFromCatalog
    ? {
      name: defaultFromCatalog.name,
      description: defaultFromCatalog.description,
      asin: defaultFromCatalog.asin,
      note: ensurePaidLinkNote(defaultFromCatalog.note || fallbackProduct.note),
    }
    : fallbackProduct;

  const defaultUrl = canonicalAmazonDpUrl(defaultProduct.asin);

  const hasProducts = Array.isArray(data.products) && data.products.length > 0;

  if (!hasProducts) {
    data.products = [
      {
        name: defaultProduct.name,
        description: defaultProduct.description,
        url: defaultUrl,
        note: ensurePaidLinkNote(defaultProduct.note),
      },
    ];
  } else {
    data.products = data.products.map((p) => {
      if (!p || typeof p !== "object") {
        return {
          name: defaultProduct.name,
          description: defaultProduct.description,
          url: defaultUrl,
          note: ensurePaidLinkNote(defaultProduct.note),
        };
      }

      return {
        name: p.name || defaultProduct.name,
        description: p.description || defaultProduct.description,
        url: normalizeProductUrl(p.url, defaultUrl),
        note: ensurePaidLinkNote(p.note || defaultProduct.note),
      };
    });
  }

  const output = matter.stringify(parsed.content, data, { lineWidth: 100 });
  await fs.writeFile(file, output, "utf8");
  console.log(`✔ Updated frontmatter: ${path.relative(ROOT, file)}`);
}

(async () => {
  const catalog = await loadCatalog();

  for await (const file of walk(ARTICLES_DIR)) {
    try {
      await retrofit(file, catalog);
    } catch (err) {
      console.warn(`⚠️  Skipped ${path.relative(ROOT, file)}: ${err?.message || String(err)}`);
    }
  }
})();
