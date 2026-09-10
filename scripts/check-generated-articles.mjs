#!/usr/bin/env node
// Quality gate for freshly generated articles. Takes file paths as arguments and
// checks each against the rules in AGENTS.md that a generator can plausibly break.
//
//   node scripts/check-generated-articles.mjs content/articles/foo.mdx ...
//
// Only newly added files are passed in, deliberately: the existing 27 articles
// have their own pre-existing issues, and a gate that fails on those would be
// switched off within a week.
//
// This replaces five gates the retired workflow called that never existed on this
// branch, two of which (power-cycle times, viewing distance) validated television
// specs and have nothing to say about decking.

import { readFileSync } from 'node:fs';

const MIN_WORDS = 300;
const MAX_TITLE_CHARS = 60;
const MAX_DESCRIPTION_CHARS = 160;
const AFFILIATE_TAG = 'buildguiders-20';

const files = process.argv.slice(2).filter(Boolean);

if (files.length === 0) {
  console.log('check-generated-articles: no files given, nothing to check.');
  process.exit(0);
}

// Counts what a reader sees, not bytes: "&amp;" is one character on screen and
// five in the file, and an em dash is one character and three bytes (AGENTS.md §9).
function visibleLength(str) {
  const decoded = str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return [...decoded].length;
}

function frontmatterValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  return m[1]
    .trim()
    .replace(/^>-\s*$/, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

const problems = [];
const note = (file, msg) => problems.push(`  ${file}\n    ${msg}`);

for (const file of files) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    note(file, 'could not be read.');
    continue;
  }

  const parts = raw.split(/^---$/m);
  if (parts.length < 3) {
    note(file, 'has no parsable frontmatter block.');
    continue;
  }
  const fm = parts[1];
  const body = parts.slice(2).join('---');

  // §9 — Google truncates past these, so anything beyond is never shown.
  const title = frontmatterValue(fm, 'title');
  if (!title) {
    note(file, 'has no title.');
  } else if (visibleLength(title) > MAX_TITLE_CHARS) {
    note(file, `title is ${visibleLength(title)} chars (max ${MAX_TITLE_CHARS}): "${title}"`);
  }

  // description may be a folded block (">-"), so take the following line too.
  let description = frontmatterValue(fm, 'description');
  if (description === '') {
    description = (fm.match(/^description:\s*>-\s*\n\s*(.+)$/m)?.[1] ?? '').trim();
  }
  if (!description) {
    note(file, 'has no description.');
  } else if (visibleLength(description) > MAX_DESCRIPTION_CHARS) {
    note(
      file,
      `description is ${visibleLength(description)} chars (max ${MAX_DESCRIPTION_CHARS}).`,
    );
  }

  // §11 — the template renders the frontmatter title as the page's H1, so a body
  // H1 gives the page two.
  if (/^# /m.test(body)) {
    note(file, 'has a body-level H1. The template already renders one from the title.');
  }

  // §4 — Amazon is the only live affiliate network; no cross-tagging.
  const amazonLinks = [...body.matchAll(/https?:\/\/(?:www\.)?amazon\.com[^\s)"']*/g)].map(
    (m) => m[0],
  );
  for (const link of amazonLinks) {
    if (!link.includes(`tag=${AFFILIATE_TAG}`)) {
      note(file, `Amazon link without tag=${AFFILIATE_TAG}: ${link}`);
    }
  }
  const foreignTag = body.match(/tag=(?!buildguiders-20)([a-z0-9]+-20)/);
  if (foreignTag) {
    note(file, `carries another site's affiliate tag: ${foreignTag[1]}`);
  }

  // Thin content ranks for nothing.
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) {
    note(file, `body is ${words} words (minimum ${MIN_WORDS}).`);
  }

  // The editorial standard: no fabricated first-hand experience. These are the
  // phrasings that survive a prompt telling the model not to write them.
  const firstHand = [
    /\bI (?:tested|tried|used|installed|measured|bought)\b/i,
    /\bI'?ve (?:tested|tried|used|installed|owned)\b/i,
    /\bwe (?:tested|tried|installed|measured)\b/i,
    /\bwe'?ve (?:tested|tried|installed|measured)\b/i,
    /\bin (?:my|our) (?:experience|testing|tests)\b/i,
    /\bthe one I reach for\b/i,
    /\bour (?:testing|lab|test bench)\b/i,
    /\bafter (?:testing|weeks with|months with)\b/i,
    /\bhands[- ]on test/i,
  ];
  for (const re of firstHand) {
    const hit = body.match(re);
    if (hit) {
      note(
        file,
        `claims first-hand experience: "${hit[0]}". Nobody on the team tests these ` +
          'products; that phrasing is both untrue and a reviews-systems ranking risk.',
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `check-generated-articles: ${problems.length} problem${
      problems.length === 1 ? '' : 's'
    } across ${files.length} file${files.length === 1 ? '' : 's'}\n\n` +
      `${problems.join('\n')}\n`,
  );
  process.exit(1);
}

console.log(
  `check-generated-articles: ${files.length} file${files.length === 1 ? '' : 's'} OK`,
);
