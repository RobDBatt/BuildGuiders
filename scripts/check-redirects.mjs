#!/usr/bin/env node
// Guards the RENAMED_GUIDE_SLUGS map in middleware.ts against the two ways it
// can silently break the site (AGENTS.md §2):
//
//   1. A key that is still a live article. The redirect would shadow a real
//      page, which is worse than the 404 it was added to prevent.
//   2. A value that is not a live article. The redirect would point at a 404,
//      so the old URL never recovers.
//
// Runs before next build, so either mistake fails the build instead of
// shipping. A comment in the map saying "every target must be live" is not a
// check; this is.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIDDLEWARE = 'middleware.ts';
const ARTICLE_DIR = join('content', 'articles');

const source = readFileSync(MIDDLEWARE, 'utf8');

const block = source.match(
  /RENAMED_GUIDE_SLUGS:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\n\};/
);

if (!block) {
  console.error(
    `check-redirects: could not find the RENAMED_GUIDE_SLUGS map in ${MIDDLEWARE}.\n` +
      'If it was renamed or restructured, update this script to match — do not delete it.'
  );
  process.exit(1);
}

// Strip comments first so a slug mentioned in prose is not read as an entry.
const body = block[1].replace(/\/\/[^\n]*/g, '');
const entries = [...body.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)].map(
  (m) => [m[1], m[2]]
);

const liveSlugs = new Set(
  readdirSync(ARTICLE_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((f) => f.replace(/\.(mdx|md)$/, ''))
);

const problems = [];

for (const [from, to] of entries) {
  if (liveSlugs.has(from)) {
    problems.push(
      `  "${from}" redirects away, but content/articles/${from}.mdx exists.\n` +
        '    The redirect shadows a live page. Remove the entry, or retire the article.'
    );
  }
  if (!liveSlugs.has(to)) {
    problems.push(
      `  "${from}" redirects to "${to}", which is not a live article.\n` +
        '    The old URL would 301 to a 404. Check the target slug for a typo.'
    );
  }
}

if (problems.length > 0) {
  console.error(
    `check-redirects: ${problems.length} broken redirect${
      problems.length === 1 ? '' : 's'
    } in ${MIDDLEWARE}\n\n${problems.join('\n')}\n`
  );
  process.exit(1);
}

console.log(
  `check-redirects: ${entries.length} guide redirect${
    entries.length === 1 ? '' : 's'
  } OK (${liveSlugs.size} live articles)`
);
