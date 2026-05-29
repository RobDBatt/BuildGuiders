#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const CATALOG_PATH = path.join(ROOT, "affiliate-products.json");
const MAP_PATH = path.join(ROOT, "article-affiliate-map.csv");

const DRY_RUN = process.argv.includes("--dry-run");
const APPLY_LOW = process.argv.includes("--apply-low");

// apply only these confidence levels (edit if you want)
const ALLOW = new Set(["high", "med", "medium"]);

const NEEDLE_NOTE = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

function canonicalDp(asin) {
  return `https://www.amazon.com/dp/${asin}/?tag=buildguiders-20`;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  const header = splitCsvLine(lines.shift());
  const rows = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] ?? ""));
    rows.push(row);
  }
  return rows;
}

function pickField(row, keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return "";
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

(async () => {
  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  const items = new Map((catalog.items || []).map((it) => [it.key, it]));
  const fallbackKey = catalog.fallbackKey;

  const csv = await fs.readFile(MAP_PATH, "utf8");
  const rows = parseCsv(csv);

  // slug -> { product_key, confidence, intent }
  const bySlug = new Map();
  for (const r of rows) {
    const slug = pickField(r, ["slug", "Slug", "article_slug", "article", "file"]);
    const product_key = pickField(r, ["product_key", "productKey", "key", "product"]);
    const confidence = pickField(r, ["confidence", "Confidence"]).toLowerCase();
    const reason = pickField(r, ["reason", "Reason"]);
    const intent = pickField(r, ["intent", "Intent"]).toLowerCase();  // Intent added
    if (!slug || !product_key) continue;
    bySlug.set(slug, { product_key, confidence, reason, intent });
  }

  let touched = 0;
  let skipped = 0;

  for await (const file of walk(ARTICLES_DIR)) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};
    const slug = (data.slug || path.basename(file, ".mdx")).trim();

    let pick = bySlug.get(slug);
    if (!pick) { skipped++; continue; }

    const isLow = !ALLOW.has(pick.confidence);

    if (isLow) {
      if (APPLY_LOW) {
        // Deterministic override for low confidence
        if (pick.intent === "network") {
          pick = { ...pick, product_key: "ethernet_cable", confidence: "low-forced" };
        } else if (pick.intent === "remote") {
          pick = { ...pick, product_key: "rechargeable_batteries", confidence: "low-forced" };
        } else {
          // Other intents with low confidence remain skipped
          skipped++; continue;
        }
      } else {
        skipped++; continue;
      }
    }

    const chosen = items.get(pick.product_key) || items.get(fallbackKey);
    if (!chosen) { skipped++; continue; }

    if (!/^[A-Z0-9]{10}$/.test(chosen.asin || "")) {
      console.warn(`⚠️  ${slug}: invalid ASIN for key=${chosen.key} asin=${chosen.asin}`);
      skipped++;
      continue;
    }

    const product = {
      name: chosen.name,
      description: chosen.description,
      url: (chosen.url && chosen.url.includes("/dp/")) ? chosen.url : canonicalDp(chosen.asin),
      note: NEEDLE_NOTE,
    };

    // Ensure products exists and replace first
    if (!Array.isArray(data.products) || data.products.length === 0) data.products = [product];
    else {
      // Check existing product[0] to potentially preserve it if not Amazon?
      // User requirement: "Ensure it never overwrites non-Amazon URLs in existing products beyond replacing products[0] (current behavior OK)."
      // Wait, user said: "Ensure it never overwrites non-Amazon URLs in existing products beyond replacing products[0] (current behavior OK)."
      // "Keep replacing only products[0] and preserve products[1..] unchanged."
      // So current behavior is indeed replacing products[0] regardless of what it is.
      // But if product[0] is NON-Amazon, should I overwrite it?
      // The user instruction is slightly ambiguous: "Ensure it never overwrites non-Amazon URLs in existing products beyond replacing products[0]"
      // This implies: Replacing products[0] is fine (even if non-amazon?), but don't touch products[1..]
      // OR maybe "if products[0] is non-amazon, treat it like products[1] and insert?"
      // Given "current behavior OK" and "replacing products[0]", I will stick to replacing products[0].
      // The instruction "preserve products[1..] unchanged" is key.
      data.products[0] = product;
    }

    const out = matter.stringify(parsed.content, data, { lineWidth: 100 });

    if (!DRY_RUN) await fs.writeFile(file, out, "utf8");

    touched++;
    console.log(`✔ ${slug} -> ${chosen.key} (${pick.confidence})`);
  }

  console.log(
    DRY_RUN
      ? `\nDRY RUN: would update ${touched} files. Skipped ${skipped}.`
      : `\nDone: updated ${touched} files. Skipped ${skipped}.`,
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
