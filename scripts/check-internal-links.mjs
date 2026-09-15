#!/usr/bin/env node
// Validates every internal link in every article against what actually exists.
//
// The failure this exists to catch shipped to production: a generated article
// linked /guides/best-vinyl+plank-flooring — a plus sign where a hyphen belongs.
// It 404'd, and nothing noticed, because a wrong href is indistinguishable from
// a right one until somebody clicks it. MDX does not resolve links at build
// time, so next build is perfectly happy to ship a dead one.
//
// Runs over the whole corpus rather than only new files: all 14 distinct link
// targets currently in the 27 published articles resolve, so this starts green
// and stays a real signal (AGENTS.md §2 — nothing internal should 404).
//
// A link is good if it is either:
//   1. /guides/<slug> where that slug is a published article, or
//   2. a route with an app/<path>/page.tsx on disk.
//
// Linking a middleware redirect source is flagged separately: it resolves for a
// reader but wastes a hop and contradicts §3's "only live 200 URLs" habit. Link
// the target directly.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ARTICLE_DIR = join('content', 'articles');
const MIDDLEWARE = 'middleware.ts';

const articles = readdirSync(ARTICLE_DIR).filter(
  (f) => f.endsWith('.mdx') || f.endsWith('.md'),
);

// Published slugs only. Linking a draft is as dead as linking a typo: the
// [slug] route does not render unpublished articles.
const publishedSlugs = new Set();
for (const file of articles) {
  const raw = readFileSync(join(ARTICLE_DIR, file), 'utf8');
  if (!/^published:\s*true\s*$/m.test(raw)) continue;
  const slug = raw.match(/^slug:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];
  publishedSlugs.add(slug ?? file.replace(/\.mdx?$/, ''));
}

// Redirect sources, so a link to one can be named as such rather than reported
// as missing. Parsed from the map the middleware actually uses.
const redirectSources = new Set();
if (existsSync(MIDDLEWARE)) {
  const mw = readFileSync(MIDDLEWARE, 'utf8');
  const block = mw.match(/RENAMED_GUIDE_SLUGS[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (block) {
    for (const m of block[1].matchAll(/^\s*['"]([^'"]+)['"]\s*:/gm)) {
      redirectSources.add(m[1]);
    }
  }
}

const problems = [];

for (const file of articles) {
  const raw = readFileSync(join(ARTICLE_DIR, file), 'utf8');

  // Markdown links to site-relative paths. Protocol-relative (//host) is
  // external, so require a non-slash after the first.
  for (const m of raw.matchAll(/\]\((\/(?!\/)[^)\s]*)\)/g)) {
    const href = m[1].replace(/[?#].*$/, '').replace(/\/$/, '') || '/';

    const guide = href.match(/^\/guides\/([^/]+)$/);
    if (guide) {
      if (publishedSlugs.has(guide[1])) continue;
      if (redirectSources.has(guide[1])) {
        problems.push(
          `  ${file}\n    links ${href}, which the middleware redirects.\n` +
            '    Costs a hop for no reason — link the current slug directly.',
        );
        continue;
      }
      problems.push(
        `  ${file}\n    links ${href}, which is not a published article.\n` +
          '    Check the slug character by character; a typo here is a 404.',
      );
      continue;
    }

    if (existsSync(join('app', href.replace(/^\//, ''), 'page.tsx'))) continue;
    if (href === '/') continue;

    problems.push(
      `  ${file}\n    links ${href}, but no app${href}/page.tsx exists.\n` +
        '    That link is a 404.',
    );
  }
}

if (problems.length > 0) {
  console.error(
    `check-internal-links: ${problems.length} problem${
      problems.length === 1 ? '' : 's'
    }\n\n${problems.join('\n')}\n`,
  );
  process.exit(1);
}

console.log(
  `check-internal-links: ${articles.length} articles, ` +
    `${publishedSlugs.size} published slugs, all internal links resolve`,
);
