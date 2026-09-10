#!/usr/bin/env node
// Guards the categoryCalculators map in lib/calculators.ts.
//
// The failure this exists to catch is silent by construction: the guide template
// renders its calculator CTA as `{calc && (...)}`, so an article whose category
// has no entry in the map simply shows no CTA. Nothing errors, nothing looks
// broken, and the cross-link that is the whole point of the article is gone.
// That is exactly what happened when the generator was taught 14 categories
// while the template still knew 9.
//
// Three checks, all cheap, run before next build:
//   1. every mapped href is a real calculator in the same file
//   2. every mapped href has a route on disk
//   3. every published article's category is in the map
//
// Check 3 is the one that matters. The first two stop a rename from rotting the
// map; the third stops content from quietly losing its CTA.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CALCULATORS = join('lib', 'calculators.ts');
const ARTICLE_DIR = join('content', 'articles');

const src = readFileSync(CALCULATORS, 'utf8');

const block = src.match(
  /export const categoryCalculators[\s\S]*?=\s*\{([\s\S]*?)\n\};/
);
if (!block) {
  console.error(
    `check-calculator-links: could not find categoryCalculators in ${CALCULATORS}.\n` +
      'If it moved or was renamed, update this script to match — do not delete it.'
  );
  process.exit(1);
}

const categoryMap = Object.fromEntries(
  [...block[1].matchAll(/["']?([a-z-]+)["']?:\s*\{\s*href:\s*"([^"]+)"/g)].map(
    (m) => [m[1], m[2]]
  )
);

if (Object.keys(categoryMap).length === 0) {
  console.error('check-calculator-links: categoryCalculators parsed to zero entries.');
  process.exit(1);
}

// The calculator list itself, so a category cannot point at something the site
// does not actually offer.
const liveHrefs = new Set(
  [...src.matchAll(/^\s*href:\s*"([^"]+)"/gm)].map((m) => m[1])
);

const problems = [];

for (const [category, href] of Object.entries(categoryMap)) {
  if (!liveHrefs.has(href)) {
    problems.push(
      `  category "${category}" -> "${href}", which is not in the calculator list.\n` +
        '    Check the href against the Calculator entries above the map.'
    );
  }
  const route = join('app', href.replace(/^\//, ''), 'page.tsx');
  if (!existsSync(route)) {
    problems.push(
      `  category "${category}" -> "${href}", but ${route} does not exist.\n` +
        '    The CTA would link to a 404.'
    );
  }
}

// Every published article must have a calculator to send readers to.
const articles = readdirSync(ARTICLE_DIR).filter(
  (f) => f.endsWith('.mdx') || f.endsWith('.md')
);

for (const file of articles) {
  const body = readFileSync(join(ARTICLE_DIR, file), 'utf8');
  if (!/^published:\s*true\s*$/m.test(body)) continue;

  const category = body.match(/^category:\s*["']?([a-z-]+)["']?\s*$/m)?.[1];
  if (!category) {
    problems.push(
      `  ${file} has no category in its frontmatter.\n` +
        '    It would render no calculator CTA.'
    );
    continue;
  }
  if (!(category in categoryMap)) {
    problems.push(
      `  ${file} is category "${category}", which has no calculator mapped.\n` +
        `    The CTA silently would not render. Add "${category}" to ` +
        'categoryCalculators, or recategorise the article.'
    );
  }
}

if (problems.length > 0) {
  console.error(
    `check-calculator-links: ${problems.length} problem${
      problems.length === 1 ? '' : 's'
    }\n\n${problems.join('\n')}\n`
  );
  process.exit(1);
}

console.log(
  `check-calculator-links: ${Object.keys(categoryMap).length} categories mapped, ` +
    `${articles.length} articles OK`
);
