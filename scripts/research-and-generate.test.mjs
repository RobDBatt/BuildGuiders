// Tests the pure logic in research-and-generate.mjs — no API key, no network.
//
// Run: npm run test:scripts
//
// Exists because two of these cases failed on the first pass: slugs are
// hyphenated while autocomplete suggestions are spaced, so patterns written with
// spaces silently defaulted every garden and lawn topic to "paint". A generator
// that mislabels categories cross-links the wrong calculator, which is invisible
// until someone reads a published article.

import { capTitle, inferCategoryFromTopic, loadCalculators, loadCategoryCalculators, validateCalculatorMap, calculatorFor, getCoverImage, resolveArticleCount } from "./research-and-generate.mjs";

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

console.log("\n— generator and guide template read ONE map —");
const catMap = loadCategoryCalculators();
eq(Object.keys(catMap).length, 14, "14 categories parsed from lib/calculators.ts");
const tpl = await import("node:fs").then(fs =>
  fs.readFileSync("app/guides/[slug]/page.tsx", "utf8"));
eq(/import \{ categoryCalculators \} from "@\/lib\/calculators"/.test(tpl), true,
   "guide template imports the shared map");
eq(/const CALCULATOR_LINKS/.test(tpl), false,
   "guide template no longer holds its own copy");
for (const c of ["roofing", "lawn", "garden", "pool", "wallpaper"])
  eq(c in catMap, true, `template can render a CTA for "${c}"`);

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

console.log("\n— batch size: the count input decides the bill —");
eq(resolveArticleCount(undefined), 20, "unset falls back to 20");
eq(resolveArticleCount(""), 20, "empty string falls back, not 0");
eq(resolveArticleCount("3"), 3, "the workflow default");
eq(resolveArticleCount(" 7 "), 7, "whitespace tolerated");
for (const bad of ["0", "-1", "abc", "2.5", "999", "1e3"]) {
  let threw = false;
  try { resolveArticleCount(bad); } catch { threw = true; }
  eq(threw, true, `rejects ${JSON.stringify(bad)}`);
}

console.log("\n— cover falls back rather than emitting a 404 path —");
eq(getCoverImage("paint"), "/og-default.png", "missing cover falls back");
eq(getCoverImage("pool"), "/og-default.png", "new category falls back too");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
