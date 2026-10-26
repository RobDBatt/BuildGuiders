// Checks a generated article against the research brief it was supposed to be
// written from. The brief is the only ground truth available at generation time,
// so what this enforces is containment: the article may not claim more than the
// research established.
//
// It exists because research-then-write raised the floor without eliminating
// fabrication. Two defects shipped to production and were only found by reading
// manufacturer documentation by hand:
//
//   1. "Behr ... requires a full cure time of 4 weeks before washing". Behr
//      publishes no cure-before-washing figure for that product at all. The
//      number came from nowhere.
//   2. "Independent testing gives it a Class 1 Wet Scrub Rating (ISO 11998)".
//      It is Zinsser's own stated rating from their European data sheet. A real
//      standardised result, reported by the manufacturer, relabelled as
//      independent.
//
// Neither is visible to any other gate: both are well-formed, correctly spelled,
// plausible sentences.
//
// SCOPE, and the reason for it. Numbers are only checked inside product sections
// — an H2 naming one of the products the brief established. Prose elsewhere
// legitimately carries numbers that are not product claims: "an hour after
// everyone has left", "a 5-by-8 bathroom has about 40 square feet of ceiling",
// "ten minutes after a shower". Checking those would fire on good writing, and a
// gate with false positives gets switched off within a week. A number in a
// product's own section is a claim about that product and has to be sourced.
//
// WHAT THIS CANNOT DO, stated plainly because it would otherwise be mistaken for
// a fact-checker: it compares the article to the brief, not the brief to the
// world. If the research pass itself invents a figure, the article inherits it
// and this passes. Closing that needs verification against the source documents,
// which is a different and much more expensive piece of work.

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

// Units a product spec is quoted in. Deliberately excludes bare counts like
// "coats" and "gallons", which appear constantly in instructions and almost
// never carry the fabrication risk.
const UNIT_ALIASES = [
  [/^minutes?$/, "minute"],
  [/^hours?$/, "hour"],
  [/^days?$/, "day"],
  [/^weeks?$/, "week"],
  [/^months?$/, "month"],
  [/^years?$/, "year"],
  [/^microns?$|^µm$/, "micron"],
  [/^mils?$/, "mil"],
  [/^g\/(?:l|litre|liter)$/, "g/l"],
];

const UNIT = String.raw`(?:minutes?|hours?|days?|weeks?|months?|years?|microns?|µm|mils?|g\/(?:l|litre|liter))`;
const NUM = String.raw`(?:\d+(?:\.\d+)?|${Object.keys(WORD_NUMBERS).join("|")})`;

function toNumber(token) {
  const key = String(token).toLowerCase();
  return Object.prototype.hasOwnProperty.call(WORD_NUMBERS, key)
    ? WORD_NUMBERS[key]
    : Number(key);
}

function normaliseUnit(raw) {
  const unit = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  for (const [pattern, canonical] of UNIT_ALIASES) {
    if (pattern.test(unit)) return canonical;
  }
  return unit;
}

// A number in a link target or a URL is not a claim.
function prose(text) {
  return String(text ?? "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, "");
}

/**
 * Spec claims in a piece of text, keyed "<value> <unit>" so that a value is only
 * satisfied by the same value in the same unit. Keying on the number alone would
 * let a brief mentioning "4 hours" support an article claiming "4 weeks".
 *
 * @returns {Map<string, string>} key -> the matched text, for the error message
 */
export function specClaims(text) {
  const body = prose(text);
  const claims = new Map();

  const add = (value, unit, label) => {
    if (!Number.isFinite(value)) return;
    if (value >= 1900 && value <= 2200) return; // a year is not a spec
    const key = `${value} ${normaliseUnit(unit)}`;
    if (!claims.has(key)) claims.set(key, label.trim());
  };

  // Ranges first, so both ends are recorded: "5 to 7 days", "250-400 sq ft".
  for (const m of body.matchAll(
    new RegExp(String.raw`(${NUM})\s*(?:-|–|to)\s*(${NUM})\s*(${UNIT})`, "gi"),
  )) {
    add(toNumber(m[1]), m[3], m[0]);
    add(toNumber(m[2]), m[3], m[0]);
  }
  for (const m of body.matchAll(new RegExp(String.raw`(${NUM})\s*(${UNIT})`, "gi"))) {
    add(toNumber(m[1]), m[2], m[0]);
  }

  // Coverage, but only as a rate. Bare square footage is usually a room.
  for (const m of body.matchAll(
    new RegExp(
      String.raw`(${NUM})\s*(?:-|–|to)?\s*(?:(${NUM})\s*)?(?:square\s+(?:feet|foot)|sq\.?\s*ft\.?)[^.]{0,30}?(?:per|a|\/)\s*gallon`,
      "gi",
    ),
  )) {
    add(toNumber(m[1]), "sqft/gal", m[0]);
    if (m[2]) add(toNumber(m[2]), "sqft/gal", m[0]);
  }

  for (const m of body.matchAll(/\b(AC|Class)\s*(\d+)\b/gi)) {
    add(Number(m[2]), m[1].toLowerCase(), m[0]);
  }
  for (const m of body.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) {
    add(Number(m[1]), "%", m[0]);
  }
  return claims;
}

// Phrasings that assert a figure was established by someone other than the
// manufacturer. The brief tags each fact "(manufacturer)" or
// "(independent: who)", so an independence claim is checkable against it.
const INDEPENDENCE_CLAIM =
  /\b(independent(?:ly)?\s+(?:test(?:ed|ing)|lab|verified|measured|review(?:ed|ers?)?)|third[- ]party\s+(?:test(?:ed|ing)|lab|verified)|lab[- ]tested|tested\s+by\s+an?\s+independent)\b/gi;

// "...the manufacturer reporting it, not an independent lab" DENIES independence.
// Flagging that would penalise the single most honest sentence the writer can
// produce about a manufacturer figure, and push the generator away from the
// phrasing this check exists to encourage. Look back a short way for a negator.
const NEGATED_BEFORE = /\b(not|rather than|isn'?t|is not|never|no)\s+(?:an?\s+|any\s+)?$/i;

function isNegated(text, matchIndex) {
  return NEGATED_BEFORE.test(text.slice(Math.max(0, matchIndex - 40), matchIndex));
}

// A figure the writer explicitly marks as coming from outside the research —
// "Behr's flat wall paint says two weeks, but that is a different product" — is
// sourced, just not from the brief. That move is how an article says "I looked
// and the real figure is not published", which is worth having rather than
// punishing. Narrow on purpose: it has to disclaim provenance in the same
// sentence.
const PROVENANCE_ESCAPE =
  /\b(different product|another product|does ?n[o']?t publish|do ?n[o']?t publish|not published|no published|publishes no|could ?n[o']?t find|unpublished)\b/i;

function sentenceAround(text, index) {
  const start = text.lastIndexOf(".", index);
  const end = text.indexOf(".", index);
  return text.slice(start + 1, end === -1 ? text.length : end + 1);
}

/**
 * Everything the article claims that the brief does not support.
 *
 * @param {string} body the article body (no frontmatter)
 * @param {{brief: string, products?: string[]}|null} research
 * @returns {string[]} problem messages, empty when the article is within its brief
 */
export function unsupportedClaims(body, research) {
  if (!research || !research.brief) return [];
  const problems = [];
  const brief = String(research.brief);
  const briefClaims = specClaims(brief);

  // 1. Independence. The brief says who established each fact; if nothing in it
  //    is independent, the article cannot say anything is.
  const briefHasIndependent = /\(\s*independent\s*:/i.test(brief);
  const asserted = [...body.matchAll(INDEPENDENCE_CLAIM)]
    .filter((m) => !isNegated(body, m.index))
    .map((m) => m[0]);
  if (asserted.length > 0 && !briefHasIndependent) {
    problems.push(
      `claims independent testing ("${asserted[0]}") but the research brief ` +
        "carries no (independent: ...) source — every fact in it came from the " +
        "manufacturer. Attribute it to the manufacturer, or cut the claim. A " +
        "manufacturer's own standardised result is still the manufacturer's.",
    );
  }

  // 2. Numbers, inside product sections only. See the scope note at the top.
  for (const section of productSections(body, research.products ?? [])) {
    for (const [key, label] of specClaims(section.body)) {
      if (briefClaims.has(key)) continue;
      const at = section.body.indexOf(label);
      if (at !== -1 && PROVENANCE_ESCAPE.test(sentenceAround(section.body, at))) {
        continue;
      }
      problems.push(
        `"${label}" under "${section.heading}" is not in the research brief. ` +
          "Every figure in a product's own section has to come from the " +
          "research — if it is not there, it is not sourced, so cut it or write " +
          "what the brief actually says.",
      );
    }
  }
  return problems;
}

// Sections whose H2 names one of the researched products. Matched on the
// distinctive words of the product name rather than the whole string, because the
// writer reasonably shortens "Zinsser Perma-White Mold & Mildew-Proof Interior
// Paint" to "Zinsser Perma-White".
export function productSections(body, products) {
  const tokens = products.map((name) =>
    String(name)
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((w) => w.length > 3 && !GENERIC_PRODUCT_WORDS.has(w)),
  );

  const sections = [];
  const parts = String(body ?? "").split(/^##\s+(.+)$/m);
  // split() yields [before, heading, body, heading, body, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim();
    const lower = heading.toLowerCase();
    const isProduct = tokens.some(
      (words) => words.length > 0 && words.some((w) => lower.includes(w)),
    );
    if (isProduct) sections.push({ heading, body: parts[i + 1] ?? "" });
  }
  return sections;
}

// Words that appear in product names but identify no product, so they must not
// make "What to Skip" look like a product section.
const GENERIC_PRODUCT_WORDS = new Set([
  "paint", "interior", "exterior", "primer", "finish", "coat", "coating",
  "acrylic", "latex", "waterborne", "alkyd", "enamel", "flat", "matte",
  "satin", "gloss", "proof", "resistant", "mold", "mildew", "bath",
  "ceiling", "wall", "walls", "floor", "flooring", "stain", "sealer",
  "premium", "plus", "home", "interior", "paint&primer",
]);
