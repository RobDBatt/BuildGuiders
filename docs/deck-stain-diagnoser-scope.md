# Deck stain problem diagnoser — scope (2026-11-11)

A tool page, not an article. You pick what went wrong with your deck stain, run
one quick check, and get the likely cause and the fixes in order from least to
most drastic, with a link to the full guide. Follows from
`docs/content-plan-2026-11.md` (PR #46).

## Why build it

The evidence is about the format, not about demand for a tool:

- **Problem-fix pages are the only format that wins on this site.** 7 problem
  guides: 43 clicks / 3,480 impressions, CTR 1.24%, avg position 15.6. 22
  best-of guides: 51 / 13,112, CTR 0.39%, position 39.1 (GSC, 3 months to
  2026-11-09).
- **The deck-stain symptoms already pull queries**, most of them landing on a
  page that isn't written for them:

  | Query | Impr | Pos |
  |---|---|---|
  | deck stain peeling after one year | 35 | 57.9 |
  | why does deck stain peel | 26 | 64.5 |
  | blotchy deck stain | 9 | 12.6 |
  | deck stain peeling | 8 | 42 |
  | why is my deck stain peeling | 5 | 34 |
  | how to remove peeling wood stain | 4 | 27 |
  | how to prep wood with peeling stain | 4 | 47.8 |
  | sticky deck after staining | 3 | 24 |
  | deck stain peeling how to fix | 3 | 48 |
  | will a sticky deck eventually dry | 2 | 19.0 |
  | why is my stain sticky | 2 | 28.0 |
  | stain not drying | 2 | 39.5 |

- **The problem guides barely link to each other.** Across the site there is
  one guide-to-guide body link (blotchy → tacky). The diagnoser becomes the
  hub that connects all four.

**What there is no evidence for:** search demand for the tool URL itself. GSC
shows no "deck stain problems" query. Treat the page as a hub that helps the
four guides, and as a way in for searches that name two symptoms at once
("blotchy and sticky"). Don't expect it to rank on its own head term. Judge it
on whether the four guides improve.

## The rule it must satisfy: AGENTS.md §7

Every symptom, check, cause and fix must be in the server-rendered HTML with no
interaction. Twelve calculators hid their output behind a button, and Google
never saw it. So:

- **A server component, no client JS in v1.** Symptom tiles at the top are
  links to `#anchor` sections. Each section is fully expanded, with no
  accordion, no tabs and no stepper.
- The "questions" are a visible decision table in each section ("Feels sticky
  or looks shiny → too much stain. Feels dry and follows the boards → wood
  wasn't ready"), not a wizard.
- A client-side "highlight my answer" layer can come later, as long as it only
  refines content that is already on the page.

## v1 symptoms

Taken from the four existing guides, plus the one timed variant GSC asks for:

| Symptom | Quick check | Full guide |
|---|---|---|
| Blotchy / patchy | Sticky or shiny vs dry and following the boards | why-is-my-deck-stain-blotchy |
| Tacky / not drying | Improving each day (weather) vs unchanged on day five (too much stain) | deck-stain-still-tacky-and-not-drying |
| Peeling / flaking | Look at the back of a flake: clean wood means it never bonded | why-is-my-deck-stain-peeling |
| Peeling after about a year | Film-forming product, or a second coat over the first | why-is-my-deck-stain-peeling (until rebuilt as plan item 2) |
| Too dark | Square feet covered per gallon vs the rate on the can | deck-stain-came-out-too-dark-fix |

Gray/faded, black spots (mildew) and lap marks are left out of v1. GSC shows no
query for them yet. Add them when it does.

## Sourcing: the real work

**Finding:** the four guides the diagnoser would draw from state their figures
without naming who asserts them. None of them can be copied across as written:

| Figure in the guides | Appears in | Status |
|---|---|---|
| Semi-transparent covers 150–200 sq ft/gal | blotchy, tacky, peeling, too-dark | No source named |
| Solid covers 200–250 sq ft/gal | too-dark | No source named |
| Moisture below 15%, 20% ceiling | blotchy, peeling | No source named |
| New pressure-treated lumber at 20–30% moisture | blotchy | No source named |
| Apply between 50 and 90°F | tacky, peeling | Attributed only to "most deck stain labels" |
| Stripper dwell time 15–45 minutes | too-dark | No source named |
| Pressure washer 500–1200 PSI on softwood | too-dark | No source named |
| Wet-on-wet fix | tacky | Attributed to unnamed "stain manufacturers" |

Approach for the diagnoser:

1. **Prefer relative checks to universal figures.** Spread rate varies by
   product, so "compare what you covered with the rate printed on your can"
   is more accurate and needs no source. Use that wherever it works.
2. **Where a number is needed, attribute it to a named maker**, e.g. "[Brand]
   states [x] sq ft per gallon for [product]". Or give it to a named
   independent source: the USDA Forest Products Laboratory's *Wood Handbook* is
   the candidate for wood moisture content. Nothing in this table has been
   checked against those sources yet. Each one needs a data sheet opened
   before it goes in.
3. **Where nobody publishes it, say so** (Form 3).
4. **Hold the data in one typed file** (`lib/deck-stain-problems.ts`). Every
   figure gets a `source: { name, url }` or `source: null` and renders as
   "not published". A small build check (`scripts/check-diagnoser-sources.mjs`,
   wired into `npm run build` like the others) fails on a figure with no
   source field. That makes the attribution rule enforceable for this page
   rather than editorial-only.

The sourced figures also fix the guides. This is plan item 5 (source-check the
winners) done once, in one place, with the guides then updated to match.

## Page details

- **URL:** `/deck-stain-problems`. It's a plain description of the page, and it
  doesn't collide with any guide slug.
- **Metadata** (§8, §9): its own title, at most 60 characters rendered (e.g.
  "Deck Stain Problems: Find the Cause and Fix"), description at most 160,
  canonical `https://www.buildguiders.com/deck-stain-problems`, OG url matching.
  One H1.
- **Sitemap:** add it to the static entries in `app/sitemap.ts`.
- **Links in:** each of the four guides gets one body link to the matching
  anchor. Add the page to the homepage/tools listing. Whether it sits in
  `lib/calculators.ts` or a new "tools" group is a judgement call; it isn't a
  calculator.
- **Links out:** each section links to its full guide, and every fix path ends
  at `/deck-stain-calculator`.
- **Affiliate:** none in v1. The page is diagnostic. Product links stay in the
  guides, under their disclosure.
- **Schema:** none in v1. In August 2023 Google announced it would limit FAQ
  rich results to well-known government and health sites and stop showing
  HowTo rich results. Not worth the markup.
- **Voice:** second person, no first-hand claims. "The usual cause", not "in
  our experience".

## Cannibalisation guard

The diagnoser carries a short version of each symptom: the check, the cause,
and fixes as one line each. The guides keep the full explanation. If the
diagnoser starts ranking for a symptom query in place of its guide (watch GSC
4–6 weeks after launch), cut that section's detail back further.

## Effort

| Part | Estimate |
|---|---|
| Source the figures (open each data sheet; about 8 figures) | ½–1 day |
| Data file, page and build check | ½ day |
| Links from four guides, sitemap, listing, metadata | 2 hours |
| Build, §13 output checks, PR | 1–2 hours |
| **Total** | **about 2 days** |

## Decisions before building

1. **URL:** `/deck-stain-problems` OK?
2. **Listing:** under calculators, or a new "tools" group on the homepage?
3. **Order against the plan:** build this before or after plan item 2 (the
   peeling-guide rebuild)? Recommended: source the figures first (it serves
   both), then the peeling rebuild, then the diagnoser, so its "after a year"
   section can link to a page that answers it.
