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

## 7. Git / PR workflow

Branch off the latest default branch; one concern per PR; `npm run build` before
pushing; squash-merge. Don't stack unrelated fixes onto a feature branch that
has an open PR — cut a fresh branch. Never rewrite already-merged history (the
squash-merge commit on the default branch is authored by GitHub — that's fine,
don't reset-author it).
