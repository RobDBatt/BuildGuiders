# BuildGuiders content plan — November 2026

Planning only. Nothing here has been written or changed on the site yet.

## Data used

All figures come from Google Search Console, property `sc-domain:buildguiders.com`,
search type Web. They were read in the GSC UI on **2026-11-11**.

| Report | Window / as-of | Notes |
|---|---|---|
| Performance, page and query | Last 3 months, chart spans 2026-08-10 → 2026-11-09 | 102 clicks, 18K impressions, CTR 0.6%, avg position 35.5. 46 page rows, 1,000 query rows |
| Performance, page | Last 28 days | Page rows sum to 35 clicks / 6,898 impressions |
| Performance, query filtered to one page | Last 3 months | Run for 7 guides; the results are below |
| Page indexing | Last update **2026-11-05** | 40 indexed, 58 not indexed (41 crawled–not indexed, 10 discovered, 6 redirect, 1 duplicate) |

The query table explains very little of the traffic. The 1,000 listed queries add
up to just **11 of the 102 clicks** and 8,923 of the ~18K impressions. GSC
anonymises the rest. The winners show it most: the tacky-stain page had 946
impressions, and only 22 of them belong to queries GSC names. The blotchy page had
692, with 23 named. **These pages win on a long tail of one-off phrasings, and no
keyword tool will show that tail.** For the same reason, no gap below is sized
with an invented volume. Each one cites only the GSC impressions it actually has.

## 1. The premise needs correcting first: the guides are already indexed

The brief assumed 41 guides were crawled but not indexed. That is not what the
bucket contains:

- **40 of the 41 are not pages.** They are `/favicon.ico?…` and
  `/_next/static/chunks/*.js|css` URLs that carry Vercel's `?dpl=` deployment
  parameter. They were crawled between Sep 10 and Oct 31. They are static assets,
  so they should never be indexed, and having them in this bucket does no harm.
  **Leave them alone.** Blocking `/_next/` in robots.txt would stop Google from
  rendering the site.
- **The 41st** is `https://buildguiders.com/flooring-calculator`, the apex host.
  It 301s to www now and was last crawled Jun 20.

So no guide is crawled-but-not-indexed, and there is no 41-page cluster to
rewrite or consolidate. The true picture for the 31 guides:

- **29 of 31 are indexed.**
- **2 have never been crawled** and sit under *Discovered – currently not indexed*:
  `deck-stain-came-out-too-dark-fix` and `best-concrete-mix`. Both have been
  known to Google since July.
- The other 8 discovered URLs are `/guides` (the hub itself), `/about`,
  `/privacy` and five calculators (concrete, deck-stain, flooring, mulch, tile).
- *Duplicate, Google chose different canonical* holds one URL, the old
  `best-exterior-house-paint-2025`. It already 301s to the 2026 slug, so it is
  correct as is.

**What follows from this:** the work is ranking and click-through on pages that
are already indexed, plus getting three never-crawled URLs fetched. Indexation
is not the constraint.

## 2. What's winning

### Confirmed: narrow problem pages win, broad "best X" pages don't

Guides grouped by format (last 3 months; position weighted by impressions):

| Format | Guides | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|---|
| Problem/fix ("why is my…", "…fix", "still tacky") | 7 | **43** | 3,480 | **1.24%** | **15.6** |
| "Best X" and how-to | 22 | 51 | 13,112 | 0.39% | 39.1 |

Problem pages hold 21% of guide impressions and earn 46% of guide clicks. Three
of them alone earned **40 of the 94 guide clicks from 12% of guide impressions**:

| Guide | 90d clicks | 90d impr | CTR | Pos | 28d clicks |
|---|---|---|---|---|---|
| why-is-my-deck-stain-blotchy | 18 | 692 | 2.6% | 6.5 | 7 |
| deck-stain-still-tacky-and-not-drying | 16 | 946 | 1.7% | 7.3 | 9 |
| paint-not-covering-in-one-coat-fix | 6 | 575 | 1.0% | 6.8 | 1 |

The brief's 28-day figures hold (tacky 9, blotchy 7). The brief missed one page:
`paint-not-covering-in-one-coat-fix` belongs with the winners. It sits at
position 6.8.

The broad pages draw impressions from page 3 to 6 and almost no clicks:

| Guide | 90d clicks | 90d impr | Pos |
|---|---|---|---|
| best-deck-stain-and-sealer | 3 | 2,016 | 47.0 |
| best-luxury-vinyl-plank-flooring-brands | 5 | 2,005 | 54.8 |
| best-white-paint-interior-walls | 1 | 791 | 37.6 |
| best-interior-paint | 1 | 605 | 47.5 |

### One correction: not every problem page wins

`why-is-my-deck-stain-peeling` (pos 36.5), `why-is-my-paint-peeling-off-the-wall`
(35.9) and `why-is-my-concrete-cracking` (37.5) share the format and don't rank.
Two things separate them from the winners:

1. **How specific the symptom is.** The winners name a state the reader is
   looking at right now: still tacky days later, blotchy, needs another coat.
   "Peeling" and "concrete cracking" are broad topics that paint makers and big
   publishers already cover. The query data shows the narrow version of the
   peeling problem exists and nothing answers it. `why-is-my-deck-stain-peeling`
   gets impressions for **"deck stain peeling after one year" (35, pos 57.9)**
   and **"why does deck stain peel" (26, pos 64.5)**. The page never frames
   itself around the one-year failure.
2. **Topic cluster.** Concrete sits outside the deck-stain/paint cluster, where
   the site's only proven pages live.

### What the winners share

- **Intent:** a reader in the middle of a project with a fault in front of them,
  not someone shopping. Queries are phrased the way people talk: "will a sticky
  deck eventually dry", "looks patchy", "it's splotchy", "will it dry
  eventually". Several read like AI-mode follow-ups, with impressions at
  position 1–3.
- **Format:** the H1 is the symptom. A two-line opening scene describes what the
  reader sees, then a **"the tell"** test tells one cause from another. After
  that comes a **fix ladder that runs from least to most drastic** (wipe → wet-on-wet → sand → strip).
  Each guide has 4–6 H2s.
- **Length:** 610–870 words. These are among the *shortest* guides on the site.
  Depth here means a decisive diagnosis, not word count.
- **Products:** secondary. Cleaner, brightener, mineral spirits, one stain. They
  are not ranked picks.
- **Links:** each points to the deck-stain or paint calculator. Contextual links
  between sibling guides are rare. Across the 31 guides there is **one** body
  link to another guide (blotchy → tacky).
- **Sourcing — a weakness to fix, not a pattern to copy:** the winners make
  unattributed figure claims: "150 to 200 square feet per gallon", "20 to 30
  percent moisture", "below roughly 15 percent", "50 and 90 degrees". These
  break the three-form rule, and the attribution checker doesn't catch them
  because they aren't appeals to authority. On GadgetGuiders, a real-source
  check found errors in about 3 of 4 pages. These are the three pages earning
  money, so check them first.

## 3. Triage of the 31 guides

No crawled-not-indexed guides exist (see §1), so this triage covers every live
guide.

**H2 skeletons.** One genuine template cluster shows up. The Sep–Oct generated
set uses *What to look for → 4 product H2s → What to skip → Bottom Line →
Related guides*: bathroom-walls-and-ceiling, bathroom-ceiling-to-prevent-mold,
bathroom-cabinets-without-sanding and waterproof-laminate-for-pets.
exterior-house-paint-2026 follows the same closing. The skeleton itself is
harmless, and rewriting it would fix nothing. The real problem is **two pairs
competing for the same queries**:

- **Bathroom paint pair — consolidate.** Both pages pull the "bathroom ceiling
  paint" query family. walls-and-ceiling ranks 52–92 on every shared query
  ("best bathroom ceiling paint" 10 @ 69.3, "bathroom wall paint" 26 @ 65.7). It
  ranks on page 1 only for its own exact title ("paint for bathroom walls and
  ceiling" 5 @ 7.4). ceiling-to-prevent-mold is four weeks old, has 508
  impressions already, and ranks 10–30 on the mold queries ("anti-mold paint"
  10 @ 13.6, "anti mold paint" 22 @ 20.2, "mold resistant ceiling paint" 6 @
  21.3, 1 click). The two pages feature the same top two products (Zinsser
  Perma-White, BM Aura Bath & Spa).
- **Interior paint trio — check later.** best-interior-paint (605 @ 47.5),
  best-paint-for-interior-walls (129 @ 29.8) and best-white-paint-interior-walls
  (791 @ 37.6) overlap on intent. Before deciding to merge, pull each page's
  query split. That was not done here.

| Guide | 90d clk / impr / pos | Pattern | Verdict |
|---|---|---|---|
| why-is-my-deck-stain-blotchy | 18 / 692 / 6.5 | Winner | **Keep. Attribution pass** (batch #5) |
| deck-stain-still-tacky-and-not-drying | 16 / 946 / 7.3 | Winner | **Keep. Attribution pass** (#5) |
| paint-not-covering-in-one-coat-fix | 6 / 575 / 6.8 | Winner | **Keep. Attribution pass** (#5) |
| paint-roller-leaving-marks-and-streaks | 2 / 386 / 16.8 | Close | **Improve** (#6) |
| why-is-my-deck-stain-peeling | 1 / 291 / 36.5 | Format right, symptom too broad | **Improve** (#2) |
| deck-stain-came-out-too-dark-fix | never crawled | Winner format | **Get it crawled** (#4) |
| why-is-my-paint-peeling-off-the-wall | 0 / 188 / 35.9 | Format right, broad | Leave for now, next batch |
| why-is-my-concrete-cracking | 0 / 402 / 37.5 | Format right, off-cluster | Leave, next batch |
| best-paint-for-bathroom-walls-and-ceiling | 3 / 269 / 44.4 | Template, cannibal | **Merge → ceiling-to-prevent-mold, 301** (#1) |
| best-paint-for-bathroom-ceiling-to-prevent-mold | 2 / 508 / 28.8 | Template | **Keep as merge target.** Remove the "I could not find" first person |
| best-paint-for-bathroom-cabinets-without-sanding | 1 / 285 / 23.0 | Template | Leave (distinct intent) |
| best-waterproof-laminate-flooring-for-pets | 3 / 318 / 33.2 | Template | Leave |
| best-primer-for-new-drywall | 9 / 1,191 / 21.3 | Best-of with how-to core | Leave. Feeds gap #8 |
| best-exterior-paint-for-wood | 6 / 1,145 / 25.1 | Best-of | Leave. Head term at pos 14.6. Feeds gap #7 |
| best-paint-for-interior-doors | 6 / 584 / 45.7 | Best-of | Leave |
| best-semi-transparent-deck-stain | 5 / 680 / 23.0 | Best-of | Leave |
| best-luxury-vinyl-plank-flooring-brands | 5 / 2,005 / 54.8 | Best-of | Leave (big-publisher SERP) |
| best-deck-stain-and-sealer | 3 / 2,016 / 47.0 | Best-of | Leave. **Fix the "My top pick" H2** (first person) |
| best-deck-stain-pressure-treated-wood | 2 / 777 / 41.1 | Best-of | Leave |
| best-paint-for-interior-walls | 2 / 129 / 29.8 | Best-of, overlaps | Leave. Check the trio merge |
| best-interior-paint | 1 / 605 / 47.5 | Best-of, overlaps | Leave. Check the trio merge |
| best-white-paint-interior-walls | 1 / 791 / 37.6 | Best-of, overlaps | Leave. Check the trio merge |
| best-solid-deck-stain | 1 / 481 / 35.0 | Best-of | Leave |
| best-vinyl-plank-flooring | 1 / 103 / 22.8 | Best-of | Leave |
| best-exterior-house-paint-2026 | 0 / 219 / 13.8 | Best-of | Leave (2025 slug adds 167 @ 28.7) |
| best-tile-for-bathroom-floor | 0 / 294 / 55.6 | Best-of | Leave |
| best-mulch-for-flower-beds | 0 / 258 / 65.4 | Best-of, off-cluster | Leave |
| best-way-to-cut-drywall | 0 / 238 / 29.1 | How-to | Leave |
| best-composite-decking | 0 / 189 / 56.3 | Best-of | Leave |
| best-way-to-stain-a-deck | 0 / 27 / 44.0 | How-to | Leave (Google barely shows it) |
| best-concrete-mix | never crawled | Best-of | Request indexing only (#4) |

## 4. Gaps

Every row has GSC impressions behind it. Lines marked *discovery* have weak
demand evidence in GSC and should be checked before they are written.

| Gap | GSC evidence (90d impr @ pos) | Nearest page today |
|---|---|---|
| Deck stain peeling after a year / why stain peels | "deck stain peeling after one year" 35 @ 57.9; "why does deck stain peel" 26 @ 64.5; "how to remove peeling wood stain" 4 @ 27; "how to prep wood with peeling stain" 4 @ 47.8; "deck stain peeling how to fix" 3 @ 48 | why-is-my-deck-stain-peeling, which doesn't frame around it |
| Restaining without stripping | "deck stain that doesn't need stripping" 19 @ 20.8; "deck stain that doesn't peel" 7 @ 23.1; "wood dock stain that doesn't peel" 7 @ 23.4 | None |
| Fixing roller marks without repainting | "how to fix paint streaks on walls" 4 @ 30.5; "how to remove roller marks without repainting" 4 @ 53; "painting roller marks" 8 @ 74.6; "can you paint over roller marks" 1 | paint-roller-leaving-marks-and-streaks |
| Painting bare exterior wood | "painting bare wood exterior" 13 @ 12.4; "best exterior primer for bare wood" 2 @ 7; "what type of exterior paint finish is best for wood" 5 @ 56.4 | One H2 inside best-exterior-paint-for-wood |
| Drywall mud/seams showing through paint *(discovery)* | "best primer to hide drywall imperfections" 5 @ 53; "best primer for drywall mud" 5 @ 45.8; "drywall sealer" 52 @ 23 | best-primer-for-new-drywall |
| White paint not covering *(fold into the existing winner)* | "why does white paint not cover well" 4 @ 36.2 | paint-not-covering-in-one-coat-fix |
| Interior wood stain sticky / gel stain won't dry *(discovery)* | "gel stain not drying", "wood stain won't dry", "wood stain tacky", "why is my stain sticky": 1–2 each, landing on the deck tacky page | deck-stain-still-tacky (deck-only) |
| Is my concrete crack normal *(off-cluster)* | "concrete cracking" 285 @ 25.7; "why does concrete crack" 43 @ 86.7; "is it normal for concrete to crack" 8; "concrete shrinkage cracks" 7 | why-is-my-concrete-cracking |

No web-search volumes are used. Any such figure would be a third-party estimate,
not GSC data.

## 5. First batch, ranked

Effort: **S** under 2 hours · **M** half a day to a day, including checking
sources · **L** more than a day.

### 1. Merge bathroom-walls-and-ceiling into bathroom-ceiling-to-prevent-mold (301) — S/M
- **Evidence:** the two pages split the "bathroom ceiling paint" family.
  walls-and-ceiling ranks 52–92 on every shared query. ceiling-to-prevent-mold
  ranks 10–30 on the mold queries, has 508 impressions four weeks after launch,
  and earned 2 clicks in its first 28 days.
- **Work:** move the walls-only content into the target as one H2 (finish for
  walls vs ceiling, shower walls). Add the old slug to `RENAMED_GUIDE_SLUGS` in
  `middleware.ts`. Confirm `check-redirects` and the sitemap drop the old URL.
  Fix the target's first-person line ("Here is what I could not find, and I went
  looking") while it is open.
- **Why first:** cheapest item with the clearest evidence, and it can't lose
  traffic the walls page actually earns (3 clicks in 90 days).

### 2. Rebuild why-is-my-deck-stain-peeling around the one-year failure — M
- **Evidence:** the page sits at 291 impressions, pos 36.5, 1 click. It gets 35
  impressions for "deck stain peeling after one year" and 26 for "why does deck
  stain peel", both at position ~60. Removal and prep queries add 4 @ 27 and
  4 @ 47.8.
- **Work:** use the winners' format. The H1 states the timed symptom. Add a
  "the tell" test (film-former on a horizontal surface, applied over old coat,
  wet wood). Run a fix ladder: scrape and spot-recoat → strip and brighten →
  switch to a penetrating product. Every product claim gets manufacturer
  attribution. Keep it around 800 words. Link to too-dark, blotchy and tacky.

### 3. New guide: restaining a deck without stripping — M
- **Evidence:** "deck stain that doesn't need stripping" 19 @ 20.8, "deck stain
  that doesn't peel" 7 @ 23.1 and "wood dock stain that doesn't peel" 7 @ 23.4.
  Each already ranks on page 2–3 with no page written for it.
- **Work:** a problem guide framed as "can I put new stain over old?" Cover when
  it works (same base, penetrating over penetrating, after clean and brighten),
  when it doesn't (solid or film-formers, switching oil and water), and the
  water-drop test. Name which manufacturers publish a recoat-without-stripping
  instruction, and say plainly where none is published. Sibling to #2. The two
  link to each other.

### 4. Get the three never-crawled URLs fetched — S, no writing
- **Evidence:** `deck-stain-came-out-too-dark-fix` is a winner-format guide in
  the winning cluster. It has sat under *Discovered – not indexed* since July,
  along with `best-concrete-mix` and the `/guides` hub.
- **Work:** request indexing in GSC URL Inspection for those three (your call,
  see below). Add contextual body links from blotchy and tacky to too-dark
  ("came out too dark instead?"). Right now its only internal links come from
  the homepage list and the related-guides block.

### 5. Attribution pass on the three winners — M
- **Evidence:** these three pages earn 40 of 94 guide clicks. They contain
  unattributed figures (coverage per gallon, wood-moisture thresholds,
  temperature windows, Ready Seal's "about two weeks" lightening) that the build
  gate can't catch. The GadgetGuiders audit found errors in about 3 of 4 pages.
- **Work:** trace each figure to a named manufacturer data sheet, or rewrite it
  as "X doesn't publish this". Change no structure, H1 or title. While in the
  tacky page, add a line on gel stain and interior stain to catch the stray
  queries (gap 7).
- **Note:** this is defensive work, so it won't grow traffic. It ranks this high
  because these pages carry the site.

### 6. Upgrade paint-roller-leaving-marks-and-streaks — S/M
- **Evidence:** 386 impressions, pos 16.8. That is the problem page closest to
  page 1. The named queries are about fixing existing marks ("how to fix paint
  streaks on walls" 4 @ 30.5, "…without repainting" 4 @ 53), while the page leads
  with technique.
- **Work:** add a "fix the marks you already have" ladder ahead of the
  prevention section (light sand and spot-roll → full wall recoat with a wet
  edge) and a short "the tell" for lap marks vs flashing vs the roller cover.
  Fold in "why does white paint not cover well" on the not-covering page in the
  same commit (a small, adjacent change).

### 7. New guide: painting bare exterior wood (prime or not, which primer) — M
- **Evidence:** "painting bare wood exterior" 13 @ 12.4 is the best-ranked
  how-to query on the site with no dedicated page. "best exterior primer for
  bare wood" 2 @ 7. best-exterior-paint-for-wood (1,145 impressions, 6 clicks)
  covers it in one H2.
- **Work:** a how-to with a problem framing (weathered vs new wood, the
  two-week-exposure question, oil vs acrylic primer per manufacturer
  instructions). Link it both ways with best-exterior-paint-for-wood.

### 8. (Optional, weaker evidence) New guide: drywall seams showing through paint — M
- **Evidence:** discovery-grade only. Two primer-for-imperfections queries at
  5 impressions each, plus the primer guide's 1,191 impressions at pos 21.3.
  This topic sits next to the paint-not-covering winner.
- **Do it only if** a check of the SERP before writing shows forum and Q&A
  results rather than brand pages.

**Deliberately left out of this batch:** rewriting any "best X" page, the
concrete and mulch topics (off-cluster), the interior-paint trio merge (needs
the query split first), and the static-asset URLs in the not-indexed report.

## 6. Needed before writing starts

1. **Approve the merge in #1.** A 301 is easy to add and slow to undo in
   Google's eyes.
2. **Request indexing** for `/guides/deck-stain-came-out-too-dark-fix`,
   `/guides/best-concrete-mix` and `/guides`. Do it yourself in GSC URL
   Inspection, or say I may click it in Chrome.
3. **Choose how the batch is written:** hand-drafted per guide, or through
   `scripts/research-and-generate.mjs` with `check-claims`. The generator's
   claims gate compares articles to their research brief, not to the world.
   For the attribution pass (#5), the figures need checking against
   manufacturer data sheets either way.
4. **Confirm scope:** the stain/paint/primer cluster only, with concrete,
   landscaping and flooring parked until this batch has a GSC read (about 4–6
   weeks after publishing).

## 7. Unrelated issues spotted (not in this batch)

- First-person voice that breaks the editorial standard: "## My top pick for
  most decks" (best-deck-stain-and-sealer) and "I could not find, and I went
  looking" (best-paint-for-bathroom-ceiling-to-prevent-mold). The second is
  fixed by #1. The first is a one-line fix.
- Body cross-links between guides are almost absent (1 across 31 guides). Items
  2–7 add them inside the cluster. A site-wide pass is separate work.
