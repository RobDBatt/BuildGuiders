// scripts/fix-mojibake-slugs.mjs
// Renames garbled MDX files caused by broken slugify regex (\s escaped as s).
// Updates the slug field inside each file's frontmatter to match.
// Safe to re-run: skips files that already have correct names.

import fs from "fs";
import path from "path";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

// Exact mapping: garbled filename → correct filename (without .mdx)
const RENAMES = {
  "am-ung4ktvhdmiport-notworking":          "samsung-4k-tv-hdmi-port-not-working",
  "am-ungarcnotworking-ono":                "samsung-arc-not-working-sonos",
  "am-unghdminotworkingno-ignal":           "samsung-hdmi-not-working-no-signal",
  "am-ungkeep-re-tartingandwontturnon":     "samsung-keeps-restarting-and-wont-turn-on",
  "appletv4knotworkingfla-hinglight":       "apple-tv-4k-not-working-flashing-light",
  "appletvhdminotworkingblack-creen":       "apple-tv-hdmi-not-working-black-screen",
  "fixdolbyatmo-notworking":                "fix-dolby-atmos-not-working",
  "lgtvhdminotworkingblack-creen":          "lg-tv-hdmi-not-working-black-screen",
  "onytvhdminotworkingblack-creen":         "sony-tv-hdmi-not-working-black-screen",
  "p-5hdminotworkingblack-creen":           "ps5-hdmi-not-working-black-screen",
  "p-5hdminotworkingfix":                   "ps5-hdmi-not-working-fix",
  "p-5hdminotworkingno-ignal":              "ps5-hdmi-not-working-no-signal",
  "viziohdminotworkingblack-creen":         "vizio-hdmi-not-working-black-screen",
  "viziotvhdminotworkingblack-creen":       "vizio-tv-hdmi-not-working-black-screen",
  "xbox-erie-hdminotworkingblack-creen":    "xbox-series-s-hdmi-not-working-black-screen",
  "xbox-erie-head-etnotworkingno-ound":     "xbox-series-s-headset-not-working-no-sound",
  "xbox-erie-lightfla-hingandwontturnoff":  "xbox-series-s-light-flashing-and-wont-turn-off",
  "xbox-erie-lightfla-hingandwontturnon":   "xbox-series-s-light-flashing-and-wont-turn-on",
  "xbox-erie-xhdminotworkingblack-creen":   "xbox-series-x-hdmi-not-working-black-screen",
};

let renamed = 0;
let skipped = 0;
let errors = 0;

for (const [oldSlug, newSlug] of Object.entries(RENAMES)) {
  const oldPath = path.join(ARTICLES_DIR, oldSlug + ".mdx");
  const newPath = path.join(ARTICLES_DIR, newSlug + ".mdx");

  if (!fs.existsSync(oldPath)) {
    if (fs.existsSync(newPath)) {
      console.log("  already fixed: " + newSlug + ".mdx");
      skipped++;
    } else {
      console.warn("  not found: " + oldSlug + ".mdx");
    }
    continue;
  }

  if (fs.existsSync(newPath)) {
    console.warn("  target exists, skipping: " + newSlug + ".mdx");
    skipped++;
    continue;
  }

  try {
    // Update the slug field in frontmatter
    let content = fs.readFileSync(oldPath, "utf8");
    content = content.replace(
      /^slug:\s*["']?[^"'\n]+["']?/m,
      `slug: "${newSlug}"`
    );

    fs.writeFileSync(newPath, content, "utf8");
    fs.unlinkSync(oldPath);
    console.log("  renamed: " + oldSlug + " → " + newSlug);
    renamed++;
  } catch (err) {
    console.error("  error renaming " + oldSlug + ": " + err.message);
    errors++;
  }
}

console.log("\nDone: " + renamed + " renamed, " + skipped + " skipped, " + errors + " errors.");
// scripts/fix-mojibake-slugs.mjs
// Renames garbled article slugs caused by broken \s regex in old slugify.
// Run once: node scripts/fix-mojibake-slugs.mjs
// Safe to re-run: skips files that already have the correct name.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");

// Exact mapping of garbled filename → correct filename
const RENAMES = {
  "am-ung4ktvhdmiport-notworking.mdx":             "samsung-4k-tv-hdmi-port-not-working.mdx",
  "am-ungarcnotworking-ono.mdx":                   "samsung-arc-not-working-sonos.mdx",
  "am-unghdminotworkingno-ignal.mdx":              "samsung-hdmi-not-working-no-signal.mdx",
  "am-ungkeep-re-tartingandwontturnon.mdx":        "samsung-keeps-restarting-and-wont-turn-on.mdx",
  "appletv4knotworkingfla-hinglight.mdx":          "apple-tv-4k-not-working-flashing-light.mdx",
  "appletvhdminotworkingblack-creen.mdx":          "apple-tv-hdmi-not-working-black-screen.mdx",
  "fixdolbyatmo-notworking.mdx":                   "fix-dolby-atmos-not-working.mdx",
  "lgtvhdminotworkingblack-creen.mdx":             "lg-tv-hdmi-not-working-black-screen.mdx",
  "onytvhdminotworkingblack-creen.mdx":            "sony-tv-hdmi-not-working-black-screen.mdx",
  "p-5hdminotworkingblack-creen.mdx":              "ps5-hdmi-not-working-black-screen.mdx",
  "p-5hdminotworkingfix.mdx":                      "ps5-hdmi-not-working-fix.mdx",
  "p-5hdminotworkingno-ignal.mdx":                 "ps5-hdmi-not-working-no-signal.mdx",
  "viziohdminotworkingblack-creen.mdx":            "vizio-hdmi-not-working-black-screen.mdx",
  "viziotvhdminotworkingblack-creen.mdx":          "vizio-tv-hdmi-not-working-black-screen.mdx",
  "xbox-erie-hdminotworkingblack-creen.mdx":       "xbox-series-s-hdmi-not-working-black-screen.mdx",
  "xbox-erie-head-etnotworkingno-ound.mdx":        "xbox-series-s-headset-not-working-no-sound.mdx",
  "xbox-erie-lightfla-hingandwontturnoff.mdx":     "xbox-series-s-light-flashing-and-wont-turn-off.mdx",
  "xbox-erie-lightfla-hingandwontturnon.mdx":      "xbox-series-s-light-flashing-and-wont-turn-on.mdx",
  "xbox-erie-xhdminotworkingblack-creen.mdx":      "xbox-series-x-hdmi-not-working-black-screen.mdx",
};

let renamed = 0;
let skipped = 0;
let missing = 0;

for (const [oldName, newName] of Object.entries(RENAMES)) {
  const oldPath = path.join(ARTICLES_DIR, oldName);
  const newPath = path.join(ARTICLES_DIR, newName);

  if (!fs.existsSync(oldPath)) {
    if (fs.existsSync(newPath)) {
      console.log("✓ Already fixed: " + newName);
      skipped++;
    } else {
      console.warn("⚠ Not found: " + oldName);
      missing++;
    }
    continue;
  }

  if (fs.existsSync(newPath)) {
    console.warn("⚠ Destination exists, skipping: " + newName);
    skipped++;
    continue;
  }

  // Also fix the slug field inside the frontmatter
  let content = fs.readFileSync(oldPath, "utf8");
  const correctSlug = newName.replace(".mdx", "");
  content = content.replace(
    /^(slug:\s*["']?)([^"'\n]+)(["']?)/m,
    (_, prefix, _oldSlug, suffix) => prefix + correctSlug + suffix
  );

  fs.writeFileSync(newPath, content, "utf8");
  fs.unlinkSync(oldPath);
  console.log("✅ Renamed: " + oldName + "  →  " + newName);
  renamed++;
}

console.log("\nDone. Renamed: " + renamed + ", Already fixed: " + skipped + ", Missing: " + missing);
