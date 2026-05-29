// scripts/narrow-focus-unpublish.mjs
//
// Sets published: false in frontmatter for any content/articles/*.mdx whose
// brand is NOT in the active in-scope list. Files stay on disk; they just
// stop rendering on the live site.
//
// Active in-scope brands (case-insensitive match against frontmatter brand):
//   TVs:       LG, Sony, Samsung, Hisense, TCL, Vizio
//   AVRs:      Denon, Marantz, Yamaha, Onkyo
//   Streamers: Apple TV, Roku, Amazon Fire TV, Google, Chromecast, Nvidia
//   Gaming:    PlayStation, PS5, Xbox, Nintendo
//   Soundbars: Sonos, Bose
//   Cables:    (no brand field — slug-based)
//
// Articles WITHOUT a brand field are left alone (legacy/generic).
// Articles already at published: false are left alone (no double-mark).
//
// USAGE:
//   node scripts/narrow-focus-unpublish.mjs --dry-run
//   node scripts/narrow-focus-unpublish.mjs

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

const ACTIVE_BRANDS = new Set([
  // TVs
  "lg", "sony", "samsung", "hisense", "tcl", "vizio",
  // AV Receivers
  "denon", "marantz", "yamaha", "onkyo",
  // Streaming devices
  "apple", "apple tv", "roku", "amazon", "fire tv", "firetv", "google", "chromecast",
  "nvidia", "nvidia shield",
  // Gaming consoles
  "playstation", "ps5", "microsoft", "xbox", "nintendo", "switch",
  // Soundbars
  "sonos", "bose",
  // Networking (common troubleshooting companion content)
  "tp-link", "netgear", "eero", "asus",
]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

function normalizeBrand(s) {
  if (!s || typeof s !== "string") return null;
  const lower = s.trim().toLowerCase();
  // Check active set directly.
  if (ACTIVE_BRANDS.has(lower)) return lower;
  // Check by prefix for compound brand names.
  for (const active of ACTIVE_BRANDS) {
    if (lower.startsWith(active)) return active;
  }
  return lower;
}

function isActive(brandRaw) {
  if (!brandRaw) return true; // no brand = leave alone
  const lower = brandRaw.trim().toLowerCase();
  return ACTIVE_BRANDS.has(lower) || [...ACTIVE_BRANDS].some((b) => lower.startsWith(b));
}

function classify(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const slug = parsed.data.slug || path.basename(filePath, ".mdx");
  const brandRaw = parsed.data.brand;
  const alreadyUnpublished = parsed.data.published === false;

  if (!brandRaw) {
    return { slug, brand: null, action: "skip-no-brand", alreadyUnpublished };
  }

  if (alreadyUnpublished) {
    return { slug, brand: brandRaw, action: "already-unpublished", alreadyUnpublished: true };
  }

  if (isActive(brandRaw)) {
    return { slug, brand: brandRaw, action: "keep", alreadyUnpublished: false };
  }

  return { slug, brand: brandRaw, action: "unpublish", alreadyUnpublished: false };
}

function applyUnpublish(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  // Surgical insertion: find closing --- of frontmatter, insert before it.
  const closeIdx = raw.indexOf("\n---", 3);
  if (closeIdx === -1) {
    console.warn(`  Could not find frontmatter close in ${filePath}`);
    return false;
  }
  const updated = raw.slice(0, closeIdx) + "\npublished: false" + raw.slice(closeIdx);
  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

function run() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(ARTICLES_DIR, f));

  const results = files.map(classify);
  const toUnpublish = results.filter((r) => r.action === "unpublish");
  const toKeep = results.filter((r) => r.action === "keep");
  const skipped = results.filter((r) => r.action !== "unpublish" && r.action !== "keep");

  console.log(`Narrow-focus unpublish:`);
  console.log(`  Total articles: ${results.length}`);
  console.log(`  Active brands (keep): ${toKeep.length}`);
  console.log(`  To unpublish: ${toUnpublish.length}`);
  console.log(`  Skipped (no brand / already unpublished): ${skipped.length}`);
  console.log("");

  if (toUnpublish.length > 0) {
    console.log("Will unpublish:");
    for (const r of toUnpublish) {
      console.log(`  ${r.slug} (brand: ${r.brand})`);
    }
    console.log("");
  }

  if (dryRun) {
    console.log("DRY RUN — no files modified.");
    return;
  }

  let changed = 0;
  for (const r of toUnpublish) {
    const filePath = path.join(ARTICLES_DIR, `${r.slug}.mdx`);
    if (!fs.existsSync(filePath)) continue;
    if (applyUnpublish(filePath)) {
      changed++;
      console.log(`  unpublished: ${r.slug}`);
    }
  }

  console.log(`\nDone. ${changed} articles unpublished.`);
}

run();
