// Tests the pure logic in research-and-generate.mjs — no API key, no network.
//
// Run: npm run test:scripts
//
// Exists because two of these cases failed on the first pass: slugs are
// hyphenated while autocomplete suggestions are spaced, so patterns written with
// spaces silently defaulted every garden and lawn topic to "paint". A generator
// that mislabels categories cross-links the wrong calculator, which is invisible
// until someone reads a published article.

import { capTitle, inferCategoryFromTopic, loadCalculators, validateCalculatorMap, calculatorFor, getCoverImage } from "./research-and-generate.mjs";

let fail = 0;
const eq = (got, want, label) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label}  got=${JSON.stringify(got)}${ok ? "" : " want=" + JSON.stringify(want)}`);
};

console.log("— calculators parsed from lib/calculators.ts —");
const cals = loadCalculators();
eq(cals.length, 14, "14 calculators found");
validateCalculatorMap(cals);
console.log("  ok   category map validates against the live list");

console.log("\n— category inference, incl. the 5 new areas —");
const cases = [
  ["best-pool-chlorine-tablets", "pool"],
  ["best-peel-and-stick-wallpaper", "wallpaper"],
  ["best-raised-garden-bed-soil", "garden"],
  ["best-grass-seed-for-shade", "lawn"],
  ["best-asphalt-shingles", "roofing"],
  ["best-composite-decking", "deck"],
  ["best-deck-stain-for-pressure-treated", "stain-sealer"],
  ["best-interior-paint", "paint"],
  ["best-mulch-for-flower-beds", "landscaping"],
  ["best-concrete-mix", "concrete"],
];
for (const [slug, want] of cases) eq(inferCategoryFromTopic(slug, ""), want, slug);

console.log("\n— every category routes to a real calculator —");
const live = new Set(cals.map(c => c.href));
for (const [slug] of cases) {
  const href = calculatorFor(inferCategoryFromTopic(slug, ""));
  eq(live.has(href), true, `${slug} -> ${href}`);
}

console.log("\n— title cap (AGENTS.md §9: <= 60 code points) —");
const titles = [
  "Best Composite Decking",
  "Best Pressure Treated Deck Stain For Horizontal Surfaces And Rails",
  "Best Exterior Paint For Wood Siding In Cold Wet Climates",
];
for (const t of titles) {
  const out = capTitle(t, " — Complete Buying Guide");
  const n = [...out].length;
  eq(n <= 60, true, `${n} chars: "${out}"`);
}

console.log("\n— cover falls back rather than emitting a 404 path —");
eq(getCoverImage("paint"), "/og-default.png", "missing cover falls back");
eq(getCoverImage("pool"), "/og-default.png", "new category falls back too");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
