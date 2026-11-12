// Data for /deck-stain-problems. Every figure on that page lives here, and
// scripts/check-diagnoser-sources.mjs fails the build if a line containing a
// number has no `source`. A source is either a named publisher with a URL, or
// `null` for a figure nobody publishes. The page renders null as "not
// published", which is a finding rather than a gap (AGENTS.md, Form 3).
//
// What each source actually says is recorded in docs/deck-stain-sources.md.
// Add a figure here only after reading it at the source.
//
// Erasable TypeScript only (no enums, no namespaces): the build check imports
// this file directly under Node's type stripping.

export type Source = { name: string; url: string } | null;

export type Line = {
  text: string;
  source?: Source;
};

export type Check = {
  sign: string;
  cause: Line;
};

export type Problem = {
  id: string;
  symptom: string;
  summary: string;
  checks: Check[];
  fixes: Line[];
  note?: Line;
  guide: { slug: string; label: string };
};

export const WOOD_HANDBOOK: Source = {
  name: "USDA Forest Products Laboratory, Wood Handbook, ch. 16",
  url: "https://research.fs.usda.gov/treesearch/62269",
};

export const BEHR_SEMI: Source = {
  name: "Behr, Premium Semi-Transparent Waterproofing Stain & Sealer",
  url: "https://www.behr.com/products/wood-stains/behr-premium-semi-transparent-waterproofing-stain-and-sealer",
};

export const PROBLEMS: Problem[] = [
  {
    id: "blotchy",
    symptom: "Blotchy or patchy",
    summary:
      "Dark splotches next to pale streaks. Either some of the stain never soaked in, or some of the wood never took it.",
    checks: [
      {
        sign: "The dark patches feel sticky or look shinier than the rest",
        cause: {
          text: "Too much stain is sitting on the surface. If a finish still looks shiny an hour after it goes on, it has not penetrated.",
          source: WOOD_HANDBOOK,
        },
      },
      {
        sign: "The patches feel dry and follow individual boards",
        cause: {
          text: "The wood wasn't ready to absorb evenly: dirt, grey weathered fibres, mill glaze on new boards, or wet wood.",
        },
      },
    ],
    fixes: [
      { text: "Stained within the last day: brush a light coat of the same stain over the blotchy areas and wipe or back-brush it out while the excess is still soft." },
      { text: "Dried blotchy from too much stain: clean and brighten to lift the surface excess, let the deck dry, then put down one thin, even coat." },
      { text: "Uneven absorption: clean and brighten the whole deck, let it dry, and recoat evenly. The starved boards take stain the second time." },
      { text: "Solid dark patches next to bare streaks: strip or sand back to bare wood and start over." },
    ],
    guide: { slug: "why-is-my-deck-stain-blotchy", label: "Why is my deck stain blotchy?" },
  },
  {
    id: "tacky",
    symptom: "Still tacky, not drying",
    summary:
      "Days later the boards still grab your feet. Either the weather has slowed the cure, or there is more stain on the surface than the wood could take.",
    checks: [
      {
        sign: "It gets a little less sticky every day",
        cause: {
          text: "Weather is slowing the cure. Labels set a window: Behr's semi-transparent stain & sealer must go on between 40 and 90°F with no rain expected for 24 hours.",
          source: BEHR_SEMI,
        },
      },
      {
        sign: "It is exactly as sticky as it was days ago",
        cause: { text: "Too much stain. The excess sitting on the surface will not cure on its own." },
      },
      {
        sign: "The whole deck is gummy, not just patches",
        cause: { text: "The stain went over an old sealer or film finish that blocked it from soaking in." },
      },
    ],
    fixes: [
      { text: "Oil-based stain: rub the tacky areas with a lint-free rag dampened in mineral spirits to lift the excess, board by board." },
      { text: "Large over-applied areas: brush a thin fresh coat of the same stain over the section to re-liquefy the excess, then wipe the whole section down." },
      { text: "Still sticky after wiping: once the residue firms up, sand the film off the affected boards." },
      { text: "Whole deck gummy: strip the failed coat, clean and brighten, let it dry, and restain." },
    ],
    note: {
      text: "Rags wet with oil-based stain are particularly susceptible to spontaneous combustion. Immerse them in water in a sealed, water-filled metal container.",
      source: WOOD_HANDBOOK,
    },
    guide: { slug: "deck-stain-still-tacky-and-not-drying", label: "Deck stain still tacky and not drying" },
  },
  {
    id: "peeling",
    symptom: "Peeling or flaking",
    summary:
      "Penetrating stain wears away by fading. Only a film can peel, so something left a film on your deck. The flakes tell you what.",
    checks: [
      {
        sign: "Glossy, thicker patches lifting where the stain pooled or overlapped",
        cause: {
          text: "Too much stain. Behr's label says over-application will lead to surface failure, including peeling and cracking.",
          source: BEHR_SEMI,
        },
      },
      {
        sign: "Wood fibres stuck to the back of the flakes",
        cause: {
          text: "The stain went onto weathered wood. A finish that fails on weathered wood often has wood fibres attached to the back of the film.",
          source: WOOD_HANDBOOK,
        },
      },
      {
        sign: "The whole deck peeling evenly after solid stain, paint or a clear film finish",
        cause: {
          text: "A film-forming product on a deck. Getting films to adhere to decks is extremely challenging, and solid-colour stains peel just like paint.",
          source: WOOD_HANDBOOK,
        },
      },
      {
        sign: "Peeling worst near the ground, in shade, or where water sits",
        cause: {
          text: "Moisture. Keeping wood at or below about 20% moisture content in service is the single most important step for any finish.",
          source: WOOD_HANDBOOK,
        },
      },
    ],
    fixes: [
      { text: "A few small patches on an otherwise sound penetrating stain: scrape off everything loose, clean, let it dry, and spot-coat thinly." },
      {
        text: "Any peeling film: strip it, then rinse at low pressure. Power washing erodes the softer earlywood faster than the latewood and leaves ridges.",
        source: WOOD_HANDBOOK,
      },
      {
        text: "Clean and brighten as the stripper maker directs. Behr says its No. 63 cleaner must follow its No. 64 stripper to clean, brighten and neutralize the wood.",
        source: BEHR_SEMI,
      },
      {
        text: "Let it dry completely, then recoat thinly with a penetrating stain. A brush is the best tool, because rollers and sprayers can put too much on a horizontal surface.",
        source: WOOD_HANDBOOK,
      },
    ],
    guide: { slug: "why-is-my-deck-stain-peeling", label: "Deck stain peeling after a year: causes and fix" },
  },
  {
    id: "peeling-after-a-year",
    symptom: "Peeling after about a year",
    summary:
      "It looked fine when it went on and failed within a year or two. That timing points at a thin film on top of the wood.",
    checks: [
      {
        sign: "The deck looked shiny or wet-looking long after staining",
        cause: {
          text: "A thin surface film formed instead of soaking in. A film like that may crack and peel within a year or two.",
          source: WOOD_HANDBOOK,
        },
      },
      {
        sign: "It peeled after a second coat",
        cause: {
          text: "The second coat may never have absorbed. Even on weathered wood, a second coat of some semi-transparent stains cannot soak in.",
          source: WOOD_HANDBOOK,
        },
      },
    ],
    fixes: [
      { text: "Treat it as peeling: strip the film, clean and brighten, let it dry, and recoat thinly with a penetrating stain." },
      { text: "On the recoat, wipe off anything still shiny an hour after it goes on.", source: WOOD_HANDBOOK },
    ],
    note: {
      text: "On the warranty: Behr covers its semi-transparent stain & sealer for 6 years on horizontal surfaces, but not when the product is not properly applied to a properly prepared surface, and it excludes labour. The remedy is new product or a refund.",
      source: BEHR_SEMI,
    },
    guide: { slug: "why-is-my-deck-stain-peeling", label: "Deck stain peeling after a year: causes and fix" },
  },
  {
    id: "too-dark",
    symptom: "Came out too dark",
    summary:
      "Darker than the chip. Either the film is too thick, the new colour stacked on an old one, or the tint simply reads darker on real wood.",
    checks: [
      {
        sign: "A gallon covered far less ground than the can says it should",
        cause: {
          text: "Too much stain. Spread rates vary by product: Behr lists 250 to 300 square feet per gallon for the first coat of its semi-transparent stain & sealer.",
          source: BEHR_SEMI,
        },
      },
      {
        sign: "You stained over the remains of an older coat",
        cause: { text: "Pigment stacked on pigment. A semi-transparent over an old semi-transparent always goes darker." },
      },
      {
        sign: "It went on evenly at the right rate and is just darker than the chip",
        cause: { text: "The tint. A chip printed on paper is not stained wood in sun." },
      },
    ],
    fixes: [
      { text: "Still wet, oil-based: wipe hard with rags dampened in mineral spirits to lift pigment before it cures." },
      { text: "Cured: nothing lightens stain in place, and staining over it only goes darker. Strip, brighten, let it dry, and restain with a lighter tint." },
      { text: "Solid stain: strip, then sand the flat boards, or recoat with a solid colour you like better." },
      {
        text: "Livable and even: wait. Behr's warranty notes that colour fading may occur. Nobody publishes how fast a too-dark coat lightens.",
        source: BEHR_SEMI,
      },
    ],
    guide: { slug: "deck-stain-came-out-too-dark-fix", label: "Deck stain came out too dark? How to fix it" },
  },
];
