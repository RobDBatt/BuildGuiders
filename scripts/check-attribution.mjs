#!/usr/bin/env node
// Enforces the attribution rule from AGENTS.md across every published article:
// a claim names who asserts it, or says the figure is not published.
//
//   node scripts/check-attribution.mjs
//
// Three failures produced the rule, all of them live on BuildGuiders before
// anyone checked a source. This script catches the shape of one of them — the
// unowned appeal to authority — because it is the one that is greppable:
//
//   "In year-long independent testing on real PT decks it held color and beaded
//    water better than the water-based field."
//
// That sentence was in a hand-written guide for months. There is no published
// independent test of that stain on pressure-treated decks; what exists is
// contractor reports and forum threads. The claim read as evidence and was not.
//
// Runs over the WHOLE corpus, not just generated files. The generator's own
// brief-aware check (check-claims.mjs) already covers new drafts, so the value
// here is catching hand-written drift — which is where the one real instance
// came from.
//
// Deliberately narrow. It flags appeals to an unnamed authority, not hedging and
// not vagueness in general: a guide is allowed to say "most people", "usually",
// or "the cheap ones tend to". What it may not do is borrow the credibility of
// testing or expertise that it cannot point at.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ARTICLE_DIR = join('content', 'articles');

// Each pattern is an appeal to authority with nobody named. The fix is always
// one of: name the source, attribute it to the manufacturer, or say the figure
// is not published.
const UNOWNED_AUTHORITY = [
  /\bindependent(?:ly)?\s+(?:test(?:ed|ing)|lab|verified|measured)\b/gi,
  /\bthird[- ]party\s+(?:test(?:ed|ing)|lab|verified)\b/gi,
  /\blab[- ]tested\b/gi,
  /\bstudies\s+show\b/gi,
  /\bresearch\s+suggests\b/gi,
  /\bexperts?\s+(?:agree|argue|say|recommend)\b/gi,
  /\bit\s+is\s+(?:widely\s+)?(?:known|believed|accepted)\b/gi,
  /\bindustry\s+reports?\b/gi,
  /\bobservers\s+have\b/gi,
  /\bsome\s+(?:reviewers|critics|analysts|experts)\s+(?:note|say|report|argue|have)\b/gi,
];

// "...the manufacturer reporting it, not an independent lab" DENIES the claim.
// Flagging that would penalise the most honest sentence available about a
// manufacturer's own figure, and push writing away from it.
const NEGATED_BEFORE = /\b(not|rather than|isn'?t|is not|never|no)\s+(?:an?\s+|any\s+)?$/i;

// A named source in the same sentence makes the appeal owned, which is the
// whole point of the rule. "Consumer Reports' independent testing" is fine.
const NAMED_SOURCE =
  /\b(Consumer Reports|Which\?|Wirecutter|Good Housekeeping|UL|ASTM|ISO|EN\s?\d|NIOSH|EPA|Fine Homebuilding|This Old House|Pro Tool Reviews|Tool Box Buzz)\b/i;

function sentenceAround(text, index) {
  const start = text.lastIndexOf('.', index);
  const end = text.indexOf('.', index);
  return text.slice(start + 1, end === -1 ? text.length : end + 1);
}

export function attributionProblems(raw) {
  const body = String(raw ?? '')
    .split(/^---$/m)
    .slice(2)
    .join('---');
  const problems = [];

  for (const pattern of UNOWNED_AUTHORITY) {
    for (const m of body.matchAll(pattern)) {
      const before = body.slice(Math.max(0, m.index - 40), m.index);
      if (NEGATED_BEFORE.test(before)) continue;

      const sentence = sentenceAround(body, m.index);
      if (NAMED_SOURCE.test(sentence)) continue;

      problems.push(
        `appeals to unnamed authority: "${m[0]}" in "...${sentence.trim().slice(0, 110)}..."\n` +
          '      Name the source, attribute it to the manufacturer, or say the ' +
          'figure is not published (AGENTS.md — every claim names who asserts it).',
      );
    }
  }
  return problems;
}

function main() {
  const files = readdirSync(ARTICLE_DIR).filter((f) => /\.mdx?$/.test(f));
  const problems = [];

  for (const file of files) {
    for (const msg of attributionProblems(readFileSync(join(ARTICLE_DIR, file), 'utf8'))) {
      problems.push(`  ${file}\n    ${msg}`);
    }
  }

  if (problems.length > 0) {
    console.error(
      `check-attribution: ${problems.length} unowned claim${
        problems.length === 1 ? '' : 's'
      } across ${files.length} articles\n\n${problems.join('\n')}\n`,
    );
    return 1;
  }

  console.log(`check-attribution: ${files.length} articles, every claim owned`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) process.exit(main());
