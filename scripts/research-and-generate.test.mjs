// Tests the pure logic in research-and-generate.mjs — no API key, no network.
//
// Run: npm run test:scripts
//
// Exists because two of these cases failed on the first pass: slugs are
// hyphenated while autocomplete suggestions are spaced, so patterns written with
// spaces silently defaulted every garden and lawn topic to "paint". A generator
// that mislabels categories cross-links the wrong calculator, which is invisible
// until someone reads a published article.

import { readFileSync, readdirSync } from "node:fs";
import { articleProblems } from "./check-generated-articles.mjs";
import { unsupportedClaims, specClaims, productSections } from "./check-claims.mjs";
import { attributionProblems } from "./check-attribution.mjs";
import { capTitle, inferCategoryFromTopic, loadCalculators, loadCategoryCalculators, validateCalculatorMap, calculatorFor, getCoverImage, resolveArticleCount, isFatalApiError, describeOutcome, isCacheFresh, loadStyleExemplar, parseBriefProducts, extractSources, researchTopic, generateArticleBody, slugSimilarity, slugsAreSimilar, slugContentWords, SLUG_SIMILARITY_THRESHOLD, selectTopics } from "./research-and-generate.mjs";

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

// A brief with no grounding sources is the model recalling in the shape of a
// brief. Accepting it was the quietest hole in the pass: the article then reads
// as sourced because its facts are tagged (manufacturer), while nothing was
// looked up.
eq(await quiet(() => researchTopic(stub({ text: BRIEF, candidates: [{ finishReason: "STOP" }] }), ASK)),
   null, "a brief with NO grounding sources is refused — that is recall, not research");

const GROUNDED = {
  text: BRIEF,
  candidates: [{
    finishReason: "STOP",
    groundingMetadata: { groundingChunks: [{ web: { uri: "https://x.test/a", title: "Pergo spec sheet" } }] },
  }],
};
const good = await quiet(() => researchTopic(stub(GROUNDED), ASK));
eq(good === null, false, "a complete, grounded brief comes back");
eq(good.products.length, 2, "and carries its products");
eq(good.sources.length, 1, "and its sources");
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

console.log("\n— the generator and the gate run ONE set of rules —");
// The retry decision and the gate verdict must come from the same code. Two
// copies would drift, and the drifting copy would be the one deciding whether a
// draft needs another pass.
const GOOD = readFileSync("content/articles/best-waterproof-laminate-flooring-for-pets.mdx", "utf8");
eq(articleProblems(GOOD).length, 0, "a live article has no problems");
eq(articleProblems(GOOD + "\n, making it ideal, ensuring value, providing grip, offering more, allowing use.").length > 0,
   true, "planted clauses are seen");
eq(articleProblems("no frontmatter here")[0], "has no parsable frontmatter block.",
   "unparsable input is a problem, not a throw");
eq(articleProblems("").length, 1, "empty string does not throw");
eq(articleProblems(null).length, 1, "null does not throw");
// The messages the retry feeds back are the gate's own wording.
const clauseMsg = articleProblems(GOOD.replace("## What to look for",
  "## What to look for\n\nIt seals, making it good. It locks, ensuring fit. It grips, providing hold. It wears, offering life. It sits, allowing use.\n")).join(" ");
eq(/delete them rather than rewriting/.test(clauseMsg), true,
   "and they say to delete rather than rewrite");

console.log("\n— a run that wrote nothing because every draft was rejected —");
eq(describeOutcome({ created: 0, failed: 0, rejected: 3, fatal: null }).ok, false,
   "all 3 drafts rejected is not a clean run");
eq(describeOutcome({ created: 0, failed: 0, rejected: 3, fatal: null }).message.includes("after a retry"), true,
   "and the message says a retry was already spent");
eq(describeOutcome({ created: 2, failed: 0, rejected: 1, fatal: null }).ok, true,
   "one rejection among three stays green — the good ones ship");
eq(describeOutcome({ created: 2, failed: 0, rejected: 1, fatal: null }).message.includes("1 rejected on quality"), true,
   "but the rejection is reported");
eq(describeOutcome({ created: 3, failed: 0, fatal: null }).message.includes("rejected"), false,
   "no rejection line when nothing was rejected");
eq(describeOutcome({ created: 0, failed: 0, unresearched: 1, rejected: 1, fatal: null }).ok, false,
   "nothing written, one of each, still a failure");

console.log("\n— the retry hands the real complaints back —");
let seen = [];
const writerStub = { models: { generateContent: async (req) => { seen.push(req.contents); return { text: "## Bottom Line\nFine.", candidates: [{ finishReason: "STOP" }] }; } } };
const ARGS = ["Best Paint for Bathroom Ceiling", "various", "paint", new Set(), { name: "Zinsser Perma-White", url: "https://www.amazon.com/s?k=x&tag=buildguiders-20" }];

seen = [];
await generateArticleBody(writerStub, ...ARGS, { brief: "CONTEXT:\n- x", sources: [], products: ["A", "B"] });
eq(/REJECTED by the quality check/.test(seen[0]), false, "a first draft carries no rejection text");

seen = [];
const COMPLAINTS = [
  'has 7 trailing ", offering"-style clauses (6.5 per 1k words, max 3). They restate significance the sentence already earned — delete them rather than rewriting.',
  'mentions a calculator but never links one.',
];
await generateArticleBody(writerStub, ...ARGS, { brief: "CONTEXT:\n- x", sources: [], products: ["A", "B"] }, COMPLAINTS);
eq(seen[0].includes(COMPLAINTS[0]), true, "the clause complaint is passed verbatim");
eq(seen[0].includes(COMPLAINTS[1]), true, "so is the calculator complaint");
eq(/DELETE the clause and end the sentence at the fact/.test(seen[0]), true,
   "and the fix is specified as deletion, not rewriting");
eq(/Do not introduce new products or new numbers/.test(seen[0]), true,
   "a fix pass must not smuggle in unresearched facts");
// An empty list must not trigger the retry wording.
seen = [];
await generateArticleBody(writerStub, ...ARGS, null, []);
eq(/REJECTED by the quality check/.test(seen[0]), false, "an empty problem list is not a retry");

console.log("\n— slug similarity: content words, not every word —");
eq([...slugContentWords("best-paint-for-bathrooms-to-prevent-mold-2026")].join(","),
   "paint,bathroom,prevent,mold", "stopwords, the year and the plural are gone");
eq([...slugContentWords("best-high-gloss-finish")].join(","), "high,gloss,finish",
   "\"gloss\" is not singularised to \"glos\"");
eq(slugSimilarity("best-for-the", "top-of-my"), 0,
   "all-stopword slugs score 0, not 1 — they must not match each other");
eq(slugSimilarity(null, "best-paint"), 0, "null does not throw");

console.log("\n— the pair that actually shipped as a duplicate —");
const SHIPPED_DUPE = ["best-paint-for-bathroom-ceiling-to-prevent-mold", "best-paint-for-bathrooms-to-prevent-mold"];
eq(slugSimilarity(...SHIPPED_DUPE).toFixed(3), "0.800", "scores 0.800 on content words");
eq(slugsAreSimilar(...SHIPPED_DUPE), true, "and is caught at the live threshold");
// The old comparison scored this 0.667 against 0.85 and let it through. If
// someone reverts to counting every word, this is the assertion that fails.
const everyWord = (a, b) => {
  const A = new Set(a.split("-")), B = new Set(b.split("-"));
  return [...A].filter((w) => B.has(w)).length / new Set([...A, ...B]).size;
};
eq(everyWord(...SHIPPED_DUPE) < SLUG_SIMILARITY_THRESHOLD, true,
   "counting every word would still miss it — the normalisation is the fix, not the threshold");

console.log("\n— the threshold must not reject topics the site publishes on purpose —");
// Measured over all 465 pairs of the 31 published slugs: at 0.80 exactly zero
// are flagged. The nearest is 0.750, so there is 0.05 of headroom and no more —
// 0.75 rejects a real pair and 0.50 rejects 18 of them.
const publishedSlugs = readdirSync("content/articles")
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => f.replace(/\.mdx?$/, ""));
eq(publishedSlugs.length >= 31, true, `corpus present (${publishedSlugs.length} slugs)`);
let falsePositives = [];
for (let i = 0; i < publishedSlugs.length; i++)
  for (let k = i + 1; k < publishedSlugs.length; k++)
    if (slugsAreSimilar(publishedSlugs[i], publishedSlugs[k]))
      falsePositives.push(`${publishedSlugs[i]} / ${publishedSlugs[k]}`);
eq(falsePositives.length, 0,
   `no published pair is flagged${falsePositives.length ? ": " + falsePositives[0] : ""}`);
eq(slugsAreSimilar("best-paint-for-interior-walls", "best-white-paint-interior-walls"), false,
   "the 0.750 pair stays allowed — this fails if the threshold is lowered");

console.log("\n— and it is honest about what it cannot catch —");
// The merged ceiling article vs the pre-existing walls-and-ceiling page. A
// lexical filter cannot see that these compete; recorded so nobody reads the
// filter as solving semantic overlap.
eq(slugsAreSimilar("best-paint-for-bathroom-ceiling-to-prevent-mold",
                   "best-paint-for-bathroom-walls-and-ceiling"), false,
   "semantic overlap at 0.500 is NOT caught, by design");

console.log("\n— selection drops near-duplicates, and keeps the better one —");
const quietLog = () => {};
const cand = (pairs) => new Map(pairs.map(([slug, score]) => [slug, { score }]));

// The exact failure from run 38490177537: both candidates in one batch.
const bathrooms = cand([
  ["best-paint-for-bathroom-ceiling-to-prevent-mold", 30],
  ["best-paint-for-bathrooms-to-prevent-mold", 28],
]);
let out = selectTopics(bathrooms, new Set(), 2, quietLog);
eq(out.ranked.length, 1, "only one of the pair is selected");
eq(out.ranked[0][0], "best-paint-for-bathroom-ceiling-to-prevent-mold",
   "and it is the higher-scoring one");
eq(out.droppedAsDuplicate, 1, "the drop is counted");

// Score order decides which survives, not map order.
out = selectTopics(cand([
  ["best-paint-for-bathroom-ceiling-to-prevent-mold", 10],
  ["best-paint-for-bathrooms-to-prevent-mold", 99],
]), new Set(), 2, quietLog);
eq(out.ranked[0][0], "best-paint-for-bathrooms-to-prevent-mold",
   "the higher score wins regardless of insertion order");

// The gap this closes: a cached run only ever matched published slugs exactly,
// so an article published after the sweep was never compared against.
out = selectTopics(
  cand([["best-paint-for-bathrooms-to-prevent-mold", 30]]),
  new Set(["best-paint-for-bathroom-ceiling-to-prevent-mold"]),
  5,
  quietLog,
);
eq(out.ranked.length, 0, "a candidate too close to a PUBLISHED slug is dropped");
eq(out.droppedAsDuplicate, 1, "and counted");

// Exact matches still drop, and are not counted as fuzzy drops.
out = selectTopics(cand([["best-interior-paint", 30]]), new Set(["best-interior-paint"]), 5, quietLog);
eq(out.ranked.length, 0, "an exact existing slug is still excluded");
eq(out.droppedAsDuplicate, 0, "an exact match is not reported as a near-duplicate");

// Distinct topics are untouched, and the limit is respected.
const distinct = cand([["best-deck-stain-and-sealer", 30], ["best-concrete-mix", 29], ["best-mulch-for-flower-beds", 28]]);
eq(selectTopics(distinct, new Set(), 5, quietLog).ranked.length, 3, "three distinct topics all survive");
eq(selectTopics(distinct, new Set(), 2, quietLog).ranked.length, 2, "the limit caps the batch");
eq(selectTopics(new Map(), new Set(), 5, quietLog).ranked.length, 0, "no candidates is not an error");

// The log says which slug it clashed with, so a surprising drop is diagnosable.
let logged = [];
selectTopics(bathrooms, new Set(), 2, (m) => logged.push(m));
eq(/dropping "best-paint-for-bathrooms-to-prevent-mold"/.test(logged.join(" ")), true,
   "the dropped slug is named");
eq(/similar to "best-paint-for-bathroom-ceiling-to-prevent-mold"/.test(logged.join(" ")), true,
   "so is what it clashed with");

console.log("\n— claims are checked against the brief that was researched —");
// Shaped like the real brief from run 38490177537, carrying the figures that
// were actually researched and NOT the two that were fabricated.
const CLAIM_BRIEF = `CONTEXT:
- Coverage is 250 to 400 square feet per gallon depending on porosity (manufacturer)

PRODUCT: Zinsser Perma-White Mold & Mildew-Proof Interior Paint
SPECS:
- Film guaranteed against mold and mildew for 5 years (manufacturer)
- 30 minutes to touch, 2 hours to recoat, 7 to 10 days to full cure (manufacturer)
- Class 1 wet scrub rating under ISO 11998, per Zinsser's European data sheet (manufacturer)
WRONG FOR: Anyone who wants a deep colour.

PRODUCT: BEHR PREMIUM PLUS Interior Ceiling Flat Paint & Primer
SPECS:
- 250 to 400 square feet per gallon (manufacturer)
- 1 hour to touch, 2 hours to recoat (manufacturer)
WRONG FOR: A bathroom that needs scrubbing.`;
const CLAIM_RESEARCH = {
  brief: CLAIM_BRIEF,
  products: ["Zinsser Perma-White Mold & Mildew-Proof Interior Paint", "BEHR PREMIUM PLUS Interior Ceiling Flat Paint & Primer"],
};
const claimsIn = (body) => unsupportedClaims(body, CLAIM_RESEARCH);

// Defect 1, verbatim from production: a number with no source anywhere.
eq(claimsIn('## BEHR Premium Plus Interior Ceiling\n\nIt requires a full cure time of 4 weeks before washing.\n').length,
   1, "the fabricated \"4 weeks\" is caught");
// Defect 2, verbatim: a manufacturer figure relabelled as independent.
eq(/claims independent testing/.test(claimsIn('## Zinsser Perma-White\n\nIndependent testing gives it a Class 1 Wet Scrub Rating (ISO 11998).\n')[0] ?? ""),
   true, "the misattributed ISO rating is caught");
// Unit sensitivity: the brief has 2 hours, so 2 weeks must not ride on it.
eq(claimsIn('## Zinsser Perma-White\n\nWait 2 weeks before washing.\n').length, 1,
   "\"2 weeks\" is not supported by \"2 hours\" in the brief");
eq(claimsIn('## Zinsser Perma-White\n\nRecoat after 2 hours.\n').length, 0,
   "but \"2 hours\" is, because the brief says so");
// Researched figures pass, including spelled-out and reworded ranges.
eq(claimsIn('## Zinsser Perma-White\n\nGuaranteed for five years. 30 minutes to touch, and 7 to 10 days to cure.\n').length,
   0, "\"five years\" matches \"5 years\"; a reworded range still matches");

console.log("\n— and it must not fire on honest writing —");
// A NEGATED independence claim is the most honest sentence available about a
// manufacturer figure. Flagging it would push the writer away from it.
eq(claimsIn('## Zinsser Perma-White\n\nThe rating is the manufacturer reporting it, not an independent lab.\n').length,
   0, "denying independence is not claiming it");
// A figure disclaimed as another product's is sourced, just not from the brief.
eq(claimsIn("## BEHR Premium Plus Interior Ceiling\n\nBehr publishes no cure figure. Their flat wall paint says two weeks, but that is a different product.\n").length,
   0, "a figure marked as a different product's is allowed");
// Prose outside product sections carries numbers that are not product claims.
eq(claimsIn('Steam sits there for an hour. A 5-by-8 bathroom has 40 square feet of ceiling.\n\n## What to skip\n\nAnything under 3 years old.\n').length,
   0, "intro and What-to-skip prose is not checked");
eq(productSections('## What to Look for\n\nx\n\n## What to Skip\n\ny\n', CLAIM_RESEARCH.products).length,
   0, "generic headings are not product sections");
// No brief means no containment check to run, not a crash.
eq(unsupportedClaims("## Zinsser Perma-White\n\n99 weeks.\n", null).length, 0, "no research, no check");
eq(unsupportedClaims("", CLAIM_RESEARCH).length, 0, "empty body does not throw");

console.log("\n— spec extraction keys on value AND unit —");
eq([...specClaims("recoat in 2 hours").keys()][0], "2 hour", "singularised unit");
eq([...specClaims("5 to 7 days").keys()].join(","), "5 day,7 day", "both ends of a range");
eq([...specClaims("250 to 400 square feet per gallon").keys()].join(","), "250 sqft/gal,400 sqft/gal",
   "coverage is a rate");
eq(specClaims("a 5-by-8 bathroom has 40 square feet of ceiling").size, 0,
   "bare square footage is a room, not a coverage spec");
eq(specClaims("in 2026 the best paint").size, 0, "a year is not a spec");
eq(specClaims("[Perma-White](https://x.test/s?k=5+gallon&tag=buildguiders-20)").size, 0,
   "numbers inside a link target are not claims");

console.log("\n— every claim names who asserts it (AGENTS.md) —");
const attr = (body) => attributionProblems(`---\ntitle: x\n---\n\n${body}`);
// The real instance, from a hand-written guide that carried it for months.
eq(attr("In year-long independent testing on real PT decks it held color better.").length, 1,
   "the unowned \"independent testing\" claim is caught");
eq(attr("Studies show it cures faster.").length, 1, "\"studies show\" is caught");
eq(attr("Experts agree on this one.").length, 1, "\"experts agree\" is caught");
// Owned claims pass — that is the point of the rule, not silence about sources.
eq(attr("Consumer Reports' independent testing put it first.").length, 0,
   "a named source makes the appeal legitimate");
eq(attr("Its Class 1 rating comes from the ISO 11998 test on Zinsser's data sheet.").length, 0,
   "naming the standard is fine");
// Denying independence must not read as claiming it.
eq(attr("The rating is the manufacturer reporting it, not an independent lab.").length, 0,
   "a negated claim is not a claim");
eq(attr("That figure is not independently verified.").length, 0, "nor is this one");
// Ordinary hedging is allowed; the rule is about borrowed authority, not vagueness.
eq(attr("Most people will not notice. The cheap ones tend to fade faster.").length, 0,
   "hedging is not an attribution failure");
eq(attributionProblems("no frontmatter").length, 0, "unparsable input does not throw");
eq(attributionProblems(null).length, 0, "null does not throw");
// The allowlist carries the outlets the portfolio actually cites, because
// GadgetGuiders coverage leans on measurement. Pinned here so the three copies
// of the script staying identical is checkable from one repo.
for (const outlet of ["RTINGS", "TechRadar", "Tom's Guide", "Project Farm"])
  eq(attr(`${outlet} measured a real-world peak of 3,337 nits in independent testing.`).length, 0,
     `"${outlet}" is a named source`);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
