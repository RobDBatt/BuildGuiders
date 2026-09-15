// Tests the pure logic in research-and-generate.mjs — no API key, no network.
//
// Run: npm run test:scripts
//
// Exists because two of these cases failed on the first pass: slugs are
// hyphenated while autocomplete suggestions are spaced, so patterns written with
// spaces silently defaulted every garden and lawn topic to "paint". A generator
// that mislabels categories cross-links the wrong calculator, which is invisible
// until someone reads a published article.

import { capTitle, inferCategoryFromTopic, loadCalculators, loadCategoryCalculators, validateCalculatorMap, calculatorFor, getCoverImage, resolveArticleCount, isFatalApiError, describeOutcome, isCacheFresh, loadStyleExemplar, parseBriefProducts, extractSources, researchTopic } from "./research-and-generate.mjs";

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

console.log("\n— substring traps: a short token must not match inside a word —");
// From run 34799314869: "waterproof" contains "roof", so a laminate flooring
// article was categorised roofing and would have rendered a Free Roof Calculator.
// "waterproof" is one of the INTENTS seeds, so this recurs across the catalogue.
for (const [slug, want] of [
  ["best-waterproof-laminate-flooring-for-pets", "flooring"],
  ["waterproof-vinyl-plank-flooring", "flooring"],
  ["best-waterproof-deck-stain", "stain-sealer"],
  ["waterproof-bathroom-paint", "paint"],
  ["most-versatile-tile", "tile"],
  ["sustainable-bamboo-flooring", "flooring"],
]) eq(inferCategoryFromTopic(slug, ""), want, slug);

// The anchors must not cost real roofing topics their category.
for (const slug of ["best-asphalt-shingles", "roofing-underlayment", "best-roof-vent-for-kitchen-exhaust-fan", "drip-edge-flashing"])
  eq(inferCategoryFromTopic(slug, ""), "roofing", slug);

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

console.log("\n— fatal API errors stop the run instead of repeating —");
// The verbatim message from run 34794137890, which burned 20 calls and went green.
const REAL_429 = '{"error":{"code":429,"message":"Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing.","status":"RESOURCE_EXHAUSTED"}}';
eq(isFatalApiError(REAL_429), true, "the credits-depleted 429 that fooled run 1");
for (const fatal of [
  "API key not valid. Please pass a valid API key.",
  "403 PERMISSION_DENIED",
  "401 UNAUTHENTICATED",
  "quota exceeded for this project",
  "NOT_FOUND: model gemini-9-ultra not found",
]) eq(isFatalApiError(fatal), true, `fatal: ${fatal.slice(0, 38)}`);

// These are per-article problems; the next topic may well succeed.
for (const transient of [
  "Gemini returned no content for: Best Deck Stain (finishReason: SAFETY)",
  "fetch failed",
  "socket hang up",
  "",
]) eq(isFatalApiError(transient), false, `not fatal: ${JSON.stringify(transient.slice(0, 38))}`);

console.log("\n— a dead run must not report success —");
eq(describeOutcome({ created: 0, failed: 20, fatal: "429 RESOURCE_EXHAUSTED" }).ok, false,
   "run 1's shape: 0 written, 20 failed");
eq(describeOutcome({ created: 0, failed: 1, fatal: "quota" }).ok, false, "0 written, 1 failed");
eq(describeOutcome({ created: 3, failed: 0, fatal: null }).ok, true, "3 written, none failed");
eq(describeOutcome({ created: 2, failed: 1, fatal: null }).ok, true, "partial success stays green");
eq(describeOutcome({ created: 0, failed: 0, fatal: null }).ok, true, "nothing attempted is not a failure");
eq(describeOutcome({ created: 0, failed: 20, fatal: "429 RESOURCE_EXHAUSTED" }).message.includes("429"), true,
   "the message names the API error");

console.log("\n— topic cache freshness —");
const NOW = Date.parse("2026-09-15T12:00:00Z");
eq(isCacheFresh("2026-09-15T11:00:00Z", NOW), true, "an hour old");
eq(isCacheFresh("2026-09-09T13:00:00Z", NOW), true, "just under a week");
eq(isCacheFresh("2026-09-08T11:00:00Z", NOW), false, "just over a week");
eq(isCacheFresh("2026-09-20T00:00:00Z", NOW), false, "future timestamp is not fresh");
eq(isCacheFresh("not-a-date", NOW), false, "garbage timestamp");
eq(isCacheFresh(undefined, NOW), false, "missing timestamp");

console.log("\n— cover falls back rather than emitting a 404 path —");
eq(getCoverImage("paint"), "/og-default.png", "missing cover falls back");
eq(getCoverImage("pool"), "/og-default.png", "new category falls back too");

console.log("\n— style exemplar read off the live corpus —");
const exemplar = loadStyleExemplar();
eq(exemplar.length > 800, true, `exemplar has substance (${exemplar.length} chars)`);
eq(/^#/.test(exemplar), false, "starts with prose, not a heading");
// The exemplar exists to demonstrate finished sentences; one cut mid-clause
// teaches the opposite, and truncation is this generator's known failure mode.
for (const part of exemplar.split("\n\n---\n\n"))
  eq(/[.!?)"]$/.test(part.trim()), true, `part ends on a complete sentence`);
// Must not smuggle in a banned tell as something to imitate.
eq(/\*\*[A-Z][^*\n]{2,30}:\*\*/.test(exemplar), false, "carries no labelled-field template");
eq(/\bI (?:tested|tried|used)\b/i.test(exemplar), false, "claims no first-hand use");
// Missing files must degrade to "" rather than throwing mid-run.
eq(loadStyleExemplar(["does-not-exist"]), "", "unreadable corpus yields empty string");

console.log("\n— research brief parsing —");
const BRIEF = `CONTEXT:
- Abrasion Class rating decides scratch resistance; AC4 is heavy residential (independent: EPLF standard)
- Laminate covers about 20 sq ft per carton (manufacturer)

PRODUCT: Mohawk RevWood Plus
SPECS:
- AC4 to AC5 depending on collection (manufacturer)
- All Pet Protection warranty covers all pets for the life of the floor (manufacturer)
WRONG FOR: Anyone unwilling to apply the perimeter sealant the warranty requires.

PRODUCT: Pergo Outlast+
SPECS:
- Rated to hold spills up to 24 hours (manufacturer)
WRONG FOR: An older dog with joint problems — laminate is harder underfoot than LVP.`;
eq(parseBriefProducts(BRIEF).length, 2, "two products parsed");
eq(parseBriefProducts(BRIEF)[0], "Mohawk RevWood Plus", "first product name");
eq(parseBriefProducts(BRIEF)[1], "Pergo Outlast+", "second product name, plus sign intact");
// The model sometimes bolds its own labels; the name must survive that.
eq(parseBriefProducts("PRODUCT: **Behr Premium Plus**")[0], "Behr Premium Plus", "bold markers stripped");
// An unfilled template placeholder is not a product.
eq(parseBriefProducts("PRODUCT: <exact product name as sold>").length, 0, "template placeholder ignored");
eq(parseBriefProducts("").length, 0, "empty brief");
eq(parseBriefProducts(null).length, 0, "null brief does not throw");

console.log("\n— grounding sources —");
eq(extractSources({ candidates: [{ groundingMetadata: { groundingChunks: [
  { web: { uri: "https://x.test/a", title: "Pergo spec sheet" } },
  { web: { uri: "https://x.test/b", title: "Pergo spec sheet" } },
] } }] }).length, 1, "duplicate sources collapse");
eq(extractSources({}).length, 0, "no grounding metadata yields none, not a throw");
eq(extractSources(null).length, 0, "null response does not throw");

console.log("\n— research refuses to hand back a brief it cannot write from —");
// These are the paths the old spec-verify step collapsed into one silent null.
// Each must return null AND be distinguishable in the log, because "the gate
// never opened" and "the budget was too small" need different fixes.
const stub = (payload) => ({ models: { generateContent: async () => payload } });
const quiet = async (fn) => {
  const [log, warn] = [console.log, console.warn];
  console.log = console.warn = () => {};
  try { return await fn(); } finally { console.log = log; console.warn = warn; }
};
const ASK = { title: "Best Waterproof Laminate Flooring for Pets", categorySlug: "flooring", productName: "Pergo Outlast+" };

eq(await quiet(() => researchTopic(stub({ text: "", candidates: [{ finishReason: "STOP" }] }), ASK)),
   null, "empty response");
eq(await quiet(() => researchTopic(stub({ text: BRIEF, candidates: [{ finishReason: "MAX_TOKENS" }] }), ASK)),
   null, "truncated brief is rejected even though it parses");
eq(await quiet(() => researchTopic(stub({ text: "PRODUCT: A\nPRODUCT: B", candidates: [{ finishReason: "STOP" }] }), ASK)),
   null, "two products but far too thin to write from");
eq(await quiet(() => researchTopic(stub({ text: "CONTEXT:\n" + "- a sourced fact about coverage and ratings that runs on. ".repeat(12), candidates: [{ finishReason: "STOP" }] }), ASK)),
   null, "long brief that established no products");

const good = await quiet(() => researchTopic(stub({ text: BRIEF, candidates: [{ finishReason: "STOP" }] }), ASK));
eq(good === null, false, "a complete brief comes back");
eq(good.products.length, 2, "and carries its products");
eq(good.brief.includes("[1]"), false, "citation markers stripped");

// A depleted quota applies to every remaining article, so it must reach the
// caller and stop the run rather than being swallowed as one skipped topic.
const fatalClient = { models: { generateContent: async () => { throw new Error("429 RESOURCE_EXHAUSTED"); } } };
let rethrown = false;
try { await quiet(() => researchTopic(fatalClient, ASK)); } catch { rethrown = true; }
eq(rethrown, true, "a fatal API error is rethrown, not swallowed");

const softClient = { models: { generateContent: async () => { throw new Error("socket hang up"); } } };
eq(await quiet(() => researchTopic(softClient, ASK)), null, "a transient error is one skipped topic");

console.log("\n— the research call is actually a search —");
// Without the googleSearch tool this whole pass is the model recalling, which is
// the state the old spec-verify step left every article in. If the tool is ever
// dropped the articles get quietly worse and nothing else would notice.
let captured;
const capturingClient = { models: { generateContent: async (req) => { captured = req; return { text: "", candidates: [{ finishReason: "STOP" }] }; } } };
await quiet(() => researchTopic(capturingClient, ASK));
eq(JSON.stringify(captured.config.tools), '[{"googleSearch":{}}]', "googleSearch tool is attached");
eq(captured.config.temperature, 0, "temperature 0 — this pass reports, it does not write");
// gemini-2.5-flash spends this budget on thinking before it answers. The old
// step asked for 350 and would have returned nothing had it ever fired.
eq(captured.config.maxOutputTokens >= 4000, true, `budget leaves room for thinking (${captured.config.maxOutputTokens})`);
eq(captured.contents.includes(ASK.productName), true, "the affiliate product is named to the researcher");
eq(captured.contents.includes(ASK.title), true, "so is the title");
// It must be allowed to reject the affiliate product: Perma-White is a wall
// paint, and the cabinets article was wrong to lead with it.
eq(/not the right product/.test(captured.contents), true, "and it may say the product does not belong");

console.log("\n— a run that researched nothing must not report success —");
eq(describeOutcome({ created: 0, failed: 0, unresearched: 3, fatal: null }).ok, false,
   "0 written because research failed on all 3");
eq(describeOutcome({ created: 0, failed: 0, unresearched: 3, fatal: null }).message.includes("RESEARCH_TIMEOUT_MS"), true,
   "and the message says where to look");
eq(describeOutcome({ created: 2, failed: 0, unresearched: 1, fatal: null }).ok, true,
   "partial research failure stays green");
eq(describeOutcome({ created: 2, failed: 0, unresearched: 1, fatal: null }).message.includes("1 skipped"), true,
   "but the skip is reported");
eq(describeOutcome({ created: 3, failed: 0, fatal: null }).message.includes("skipped"), false,
   "no skip line when nothing was skipped");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
