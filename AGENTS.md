<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Content & editorial voice (standard for all Guiders sites)

Our guides are researched and written with AI assistance, and no one on the team
personally lab-tests the products. The writing must reflect that honestly. This
standard applies to BuildGuiders, GearGuiders, GadgetGuiders, and every other
Guiders site — copy this section into each site's AGENTS.md.

**Never fabricate first-hand experience.** No "I tested," "I've used," "the one I
reach for," "after enough jobs," "the line I show clients," "the quietest floor
I've walked," or invented named authors with credentials/photos. Google's reviews
systems specifically detect and discount fabricated first-hand experience, so this
is a ranking risk as well as a trust one.

**Write in honest voice instead:**
- Second person ("you") or impersonal ("the pick for X," "the go-to when…").
- Frame picks as *researched and compared*, not *tested by us*.
- Ground recommendations in manufacturer specs, independent/professional reviews
  (e.g. Consumer Reports, trade reviews), and verified buyer feedback — and only
  claim those sources.

**Attribution:** byline is the editorial entity ("BuildGuiders team" / the site's
team), never a fabricated individual expert. Link it to the /about methodology.

**Numbers must be real:** keep coverage rates, specs, and price ranges grounded in
manufacturer/retailer data; never invent star ratings, "we measured" figures, or
test results.

**Disclosure:** every guide shows an affiliate disclosure above the affiliate
links; /about carries the full FTC disclosure and the research methodology.

# Technical launch & SEO playbook (standard for all Guiders sites)

Hard-won checklist for spinning up or rebranding a Guiders site so we get it
right the first time. Copy this section into each site's AGENTS.md. Every item
here is something we've had to fix after the fact at least once.

## 1. Canonical host — decide ONCE, set it in three places, same direction

Pick www **or** apex as the canonical host before launch and never mix. The
choice must be identical in all three of:
- **Code:** `metadataBase`, per-page `canonical`, OpenGraph `url`, and the
  sitemap's `BASE_URL` all use the canonical host.
- **Vercel:** set the canonical host as the **Production/primary** domain, and
  set the *other* host to **Redirect to** the canonical one.
- **Middleware:** redirect the non-canonical host → canonical with a 301/308.

**The trap that bit us:** middleware and Vercel pointing *opposite* directions
(middleware www→apex while Vercel did apex→www) creates an **infinite
apex↔www redirect loop** and takes the site down. Always redirect *toward* the
canonical host in both. If Vercel already redirects, the middleware rule is
harmless (edge fires first); if it doesn't, middleware covers it. Match a live
example: `buildguiders`/`gadgetguiders` are canonical **www**, `gearguiders` is
canonical **apex** — read that site's `metadataBase` before assuming.

## 2. Old URLs never 404 — 301 them (critical during a rebrand)

When content is removed or the site pivots topic, every dead URL must **301 to a
relevant live page or a sensible fallback** (`/articles`), never hard-404.
- Keep a `RETIRED_ARTICLE_SLUGS` set (and legacy category/brand maps) that the
  middleware redirects. Add slugs here the moment content is retired.
- `/posts/:slug`, `/articles/:slug`, and other legacy path shapes should resolve
  to the live slug if it exists, else the listing page.
- Verify a slug is **absent from the live article set** before retiring it, so a
  redirect never shadows a real page.
- Lingering 404s slow Google's re-classification during a rebrand — clean 301s
  tell it "old chapter closed, index the new one."

## 3. Sitemap & robots hygiene

- `sitemap.ts` must emit **only live 200 URLs** on the canonical host. Never
  include a URL the middleware redirects (a 3XX in the sitemap is an Ahrefs/GSC
  flag) and never a 404.
- Filter retired/legacy slugs out of the sitemap explicitly.
- `robots.ts` points `sitemap:` at the canonical-host `/sitemap.xml`.
- A sitemap URL showing "Crawled – currently not indexed" in GSC is **normal**
  (Google doesn't index the sitemap file as a page) — not a bug.

## 4. Affiliate layer (in the root layout)

- **Amazon:** every product link carries the site's own tag
  (`buildguiders-20`, `gearguiders-20`, `gadgetguiders01-20`). No cross-tagging.
- **Skimlinks: removed Jul 2026, permanent.** Do not re-add it to any site in
  the network, and do not reintroduce a Sovrn/VigLink equivalent in its place.
- **Impact UTT: removed Jul 2026** after the application was denied. Reapply
  around Oct 2026. If approved, the `utt.impactcdn.com/…` snippet goes back in
  as a `beforeInteractive` script (so it lands in the server-rendered HTML) —
  it both **verifies domain ownership** and runs `transformLinks` to auto-track
  partnered advertisers like Home Depot. Add the matching `/privacy` disclosure
  in the same change, not after.
- **Only add a network's script once the account is live.** A tag for a denied
  or closed account tracks nothing and still costs render time on every page.
- Disclosure above the links, `/about` methodology, and `/privacy` naming the
  actual networks in use must all exist, and `/privacy` must not name a network
  the site no longer runs.

## 5. Deploy BEFORE you verify

Any external verifier that fetches the **live** site — Impact "Add Website",
GSC ownership, affiliate approvals — must run **after** the change is merged to
production and confirmed live (view-source the homepage for the tag). Clicking
verify while the change is still on a feature branch fails against the old
production HTML. Order: merge → Vercel deploy → confirm live → verify.

## 6. GSC ↔ Ahrefs: "no data" usually means "not indexed," not "disconnected"

- Use a GSC **Domain property** (`sc-domain:example.com`) — it covers www, apex,
  http, https at once. Point the Ahrefs GSC integration at that exact property.
- Before concluding the integration is broken, check GSC **Performance**
  (not Pages). A young site with a handful of impressions and everything in
  "Crawled – currently not indexed" legitimately returns empty in Ahrefs —
  there's nothing to report, the pipe is fine. Reconnecting won't help; only
  getting pages indexed and earning authority will.
- A sibling site pulling data with the same tool/date range is your control that
  the connection and query are fine.

## 7. The page's value must be in the server-rendered HTML

**The worst thing we've shipped.** Twelve of thirteen calculators hid their
results and shopping list behind a Calculate button. A crawler never presses it,
so the shopping-list output — the entire reason to pick us over calculator.net —
was invisible to Google on every one of them. The mulch calculator sat at zero
GSC impressions for twelve months and it read as a ranking problem. It wasn't:
the page had 93 crawlable words and no title.

- **Never gate the differentiator behind an interaction.** Seed the inputs with a
  common, realistic project and render a populated result on first paint. Keep an
  empty state for when a user clears the fields — that's the only time it shows.
- JS rendering does not save you. Googlebot executes JavaScript; it does not
  click buttons, fill forms, or scroll to trigger loads.
- A `"use client"` page is still server-rendered on first request. Whatever the
  initial state produces is what gets indexed, so make the initial state useful.
- Seeded defaults must be **deterministic**. `crypto.randomUUID()` or `Date.now()`
  in initial state gives the server and client different markup.

## 8. Every route ships its own title, description and canonical

Ten pages once shared the site-default title and emitted no canonical at all.
`metadataBase` alone does **not** emit a canonical tag.

- A `"use client"` page cannot export `metadata` — it needs a sibling
  `layout.tsx` that does. That's the pattern; follow it for every interactive page.
- Server components export `metadata` directly.
- The root layout needs `alternates: { canonical: "/" }` for the homepage.

## 9. Title ≤60 characters, description ≤160 — measured on the rendered page

Seventeen guide titles ran to 78 characters and seventeen descriptions to 219.
Google truncates both, so the tail was never shown — and on our best-ranking
page the half that survived was the dishonest half.

- Measure the **rendered** `<title>`, not the frontmatter string. The
  `%s | BuildGuiders` template costs 15 characters, so the page portion has ~45.
- Decode HTML entities before counting: `&amp;` is one character on screen and
  five in the file. `wc -c` and bash `${#var}` count bytes, so an em dash reads
  as three. Count code points.
- Lead with the head term. The year belongs on "best of" guides where freshness
  is a ranking signal, not on evergreen troubleshooting pages.

## 10. Structured data must point at assets that exist

All 26 guides emitted Article schema whose `image` resolved to a 404, because
the frontmatter pointed at `/images/covers/` and nothing was ever committed
there. Google requires a resolvable `image` for the Article rich result, so
every one of them was invalid — and no crawler flags it, because the path only
appears in JSON-LD and OG tags, never as an `<img>`.

- Resolve image paths against `public/` **at build time** and fall back to a
  known-good asset. `resolveCoverImage()` in `lib/articles.ts` is the pattern.
- Same for `Organization.logo` and `publisher.logo`.
- After a build, grep the output for the schema image URL and confirm the file
  is actually in `public/`.

## 11. One H1 per page

Four guides carried a body-level `# Heading` on top of the template's H1. If the
template renders the frontmatter title as the H1, the MDX body must start at
`##`.

## 12. The honesty standard covers title tags and meta descriptions

See "Content & editorial voice" above — it applies to **metadata**, not just body
prose. "Tested Picks" in a title tag is the same fabrication as "I tested" in a
paragraph, and it does more damage, because the title is the part Google shows.
Our highest-impression page carried it for months.

## 13. Verify these after every build, before pushing

The failures above are all invisible in the source and obvious in the output.
Check the built HTML, not the components:

```bash
npm run build
# every page has a unique title + canonical
cd .next/server/app && for f in *.html guides/*.html; do
  printf "%s %s %s\n" "$f" "$(grep -c 'rel=\"canonical\"' $f)" \
    "$(grep -o '<title>[^<]*</title>' $f)"; done | sort
# the tool's output is actually in the HTML
grep -c "Your Shopping List" *-calculator.html
# no NaN/undefined leaking into rendered text
```

## 14. Git / PR workflow

Branch off the latest default branch; one concern per PR; `npm run build` before
pushing; squash-merge. Don't stack unrelated fixes onto a feature branch that
has an open PR — cut a fresh branch. Never rewrite already-merged history (the
squash-merge commit on the default branch is authored by GitHub — that's fine,
don't reset-author it).
