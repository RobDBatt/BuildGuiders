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
- **Skimlinks: REMOVED Aug 2026 — application denied Jul 2026.** Do NOT re-add
  the `s.skimresources.com` script. If approved later, restore a `lazyOnload`
  tag gated on `NEXT_PUBLIC_SKIMLINKS_ID` with **no hardcoded fallback ID**, so
  an un-set variable means the tag stays off.
- **Impact UTT: REMOVED Aug 2026 — Home Depot application denied Jul 2026.**
  Do NOT add the `utt.impactcdn.com/…` snippet. Reapply to Home Depot once
  traffic has grown; only then add the UTT script (`beforeInteractive`,
  override via `NEXT_PUBLIC_IMPACT_UTT_SRC`, again with no fallback ID).
- **This section previously described both as installed, which is how they
  survived the denial by ten months.** When a network is denied, change the doc
  in the same commit that removes the script — a playbook that still says
  "install it" is an instruction to put it back.
- Disclosure above the links, `/about` methodology, and `/privacy` naming the
  actual networks must all exist. `/privacy` currently describes affiliate
  cookies generically (Amazon and retailer links) and needs no change while
  Amazon is the only network in use.

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

**Learned the hard way on BuildGuiders.** Twelve of its thirteen calculators hid
their results behind a Calculate button. A crawler never presses it, so the
shopping-list output — the entire reason to pick that site over a competitor —
was invisible to Google on every one of them. One page sat at zero GSC
impressions for twelve months and it read as a ranking problem. It wasn't: the
page had 93 crawlable words and no title of its own.

The same trap applies to any interactive component on a content site — a
comparison table behind a filter, spec detail inside a collapsed accordion, a
"show more" that reveals half the article.

- **Never gate substance behind an interaction.** Render the populated state
  server-side and let the interaction refine it, not reveal it.
- JS rendering does not save you. Googlebot executes JavaScript; it does not
  click buttons, fill forms, expand accordions, or scroll to trigger loads.
- A `"use client"` component is still server-rendered on first request. Whatever
  the initial state produces is what gets indexed, so make it useful.
- Any seeded default must be **deterministic**. `crypto.randomUUID()` or
  `Date.now()` in initial state gives the server and client different markup.

## 8. Every route ships its own title, description and canonical

BuildGuiders had ten pages sharing the site-default title and emitting no
canonical at all. `metadataBase` alone does **not** emit a canonical tag.

- A `"use client"` page cannot export `metadata` — it needs a sibling
  `layout.tsx` that does. Follow that pattern for every interactive page.
- Server components export `metadata` directly.
- The root layout needs `alternates: { canonical: "/" }` for the homepage.

## 9. Title ≤60 characters, description ≤160 — measured on the rendered page

Seventeen BuildGuiders guide titles ran to 78 characters and seventeen
descriptions to 219. Google truncates both, so the tail was never shown — and on
the best-ranking page, the half that survived was the dishonest half.

- Measure the **rendered** `<title>`, not the frontmatter string. The
  `%s | SiteName` template costs its own length, leaving ~45 for the page.
- Decode HTML entities before counting: `&amp;` is one character on screen and
  five in the file. `wc -c` and bash `${#var}` count bytes, so an em dash reads
  as three. Count code points.
- Lead with the head term. The year belongs on "best of" guides where freshness
  is a ranking signal, not on evergreen troubleshooting pages.

## 10. Structured data must point at assets that exist

All 26 BuildGuiders guides emitted Article schema whose `image` resolved to a
404, because the frontmatter pointed at a covers directory nothing was ever
committed to. Google requires a resolvable `image` for the Article rich result,
so every one was invalid — and no crawler flags it, because the path appears
only in JSON-LD and OG tags, never as an `<img>`.

- Resolve image paths against `public/` **at build time** and fall back to a
  known-good asset.
- Same for `Organization.logo` and `publisher.logo`.
- After a build, grep the output for the schema image URL and confirm the file
  is actually in `public/`. A checklist item saying "cover images exist" is not
  a check; something in the build has to fail.

## 11. One H1 per page

Four BuildGuiders guides carried a body-level `# Heading` on top of the
template's H1. If the template renders the frontmatter title as the H1, the MDX
body must start at `##`.

## 12. The honesty standard covers title tags and meta descriptions

See "Content & editorial voice" above — it applies to **metadata**, not just body
prose. "Tested Picks" in a title tag is the same fabrication as "I tested" in a
paragraph, and it does more damage, because the title is the part Google shows.
BuildGuiders' highest-impression page carried exactly that for months.

## 13. Verify these after every build, before pushing

The failures above are invisible in the source and obvious in the output. Check
the built HTML, not the components:

```bash
npm run build
# every page has a unique title + a canonical
cd .next/server/app && for f in **/*.html; do
  printf "%s %s %s\n" "$f" "$(grep -c 'rel=\"canonical\"' $f)" \
    "$(grep -o '<title>[^<]*</title>' $f)"; done | sort
# one H1 per page
for f in **/*.html; do echo "$(grep -o '<h1' $f | wc -l) $f"; done | grep -v '^1 '
# no NaN/undefined leaking into rendered text
```

## 14. Git / PR workflow

Branch off the latest default branch; one concern per PR; `npm run build` before
pushing; squash-merge. Don't stack unrelated fixes onto a feature branch that
has an open PR — cut a fresh branch. Never rewrite already-merged history (the
squash-merge commit on the default branch is authored by GitHub — that's fine,
don't reset-author it).

## 15. A branch is not shipped until it is merged and confirmed live

Two failures in the Aug 2026 portfolio review, both of which left correct,
finished code doing nothing:

- **VBAtoPython** — three SEO commits (orphan-page links, title/description
  caps) were written and pushed to `claude/portfolio-disavow` between 22 Jul
  and 13 Aug, and **no PR was ever opened**. The site sat at Ahrefs Health 83
  with 9 orphan-page errors for three weeks while the fix already existed on a
  branch. Every weekly Ahrefs mail reported the problem as unfixed, correctly.
- **GadgetGuiders** — `claude/seo-playbook-sections` was **promoted to
  production from its branch deployment** in the Vercel dashboard and never
  merged. Production briefly served a commit that was not on `main`, the next
  push to `main` silently reverted it, and `main` never received the doc at all.

The rule:

- **Opening the PR is part of doing the work.** If you push a branch, open its
  PR in the same session. A pushed branch with no PR is invisible — nothing
  links to it, nothing is waiting on it, and it will not be found again.
- **Never promote a branch deployment to production instead of merging.** It
  looks like shipping and isn't: the next default-branch deploy reverts it and
  the change is absent from the repo's history. Merge, and let the
  default-branch deploy promote itself.
- **Confirm it live.** §5 says deploy before you verify; this is the other half.
  After the merge deploy goes green, fetch the actual URL that was broken and
  check the change is in the response — same standard as the working-style rule
  that nothing is done until verified on the page that was broken.
- **A tool still reporting the problem is evidence, not noise.** If Ahrefs or
  GSC still flags something you "fixed," assume it never shipped and check
  before assuming the tool is stale.

Sweep for stranded work when picking up a repo — branches ahead of the default
branch that never had a PR opened:

```bash
git fetch --prune
DEFAULT=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
git for-each-ref --format='%(refname:short)' refs/remotes/origin \
  | sed 's|^origin/||' | grep -vx "$DEFAULT" | grep -vx HEAD \
  | while read -r b; do
      ahead=$(git rev-list --count "origin/$DEFAULT..origin/$b" 2>/dev/null || echo 0)
      [ "$ahead" -eq 0 ] && continue
      prs=$(gh pr list --head "$b" --state all --json number --jq 'length' 2>/dev/null || echo 0)
      [ "$prs" -eq 0 ] && echo "  $b (+$ahead commits, no PR)"
    done
true
```

Run against the portfolio on 14 Aug 2026 this found stranded work in four of
five repos, including a 39-commit branch on VBAtoPython.
