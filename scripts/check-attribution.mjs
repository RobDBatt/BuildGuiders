#!/usr/bin/env node
// Enforces the attribution rule from the shared editorial standard across every
// piece of content: a claim names who asserts it, or says the figure is not
// published.
//
//   node scripts/check-attribution.mjs
//
// Four failures across the portfolio produced the rule, all of them live before
// anyone checked a source. This script catches the shape of two of them — the
// unowned appeal to authority — because it is the one that is greppable:
//
//   "In year-long independent testing on real PT decks it held color and beaded
//    water better than the water-based field."   (BuildGuiders, hand-written)
//
//   "rated up to 5,000 nits of peak brightness, and independent testing measures
//    a real-world peak north of 3,000 nits"      (GadgetGuiders, hand-written)
//
// Both sentences read as evidence and were not. The second one's number was
// right — TechRadar measured 3,337 nits and Tom's Guide 3,916 on a 10% HDR
// window — which is the point: a true figure resting on borrowed authority is
// still unsourced, and the fix was naming the measurer rather than cutting the
// claim.
//
// Identical in BuildGuiders, GearGuiders and GadgetGuiders. Keep it that way:
// copy the whole file rather than editing one copy, or the three drift and the
// strictest one gets switched off.
//
// SCOPE. Walks content/ recursively, so it covers every directory a site keeps
// content in — articles, brands, posts, snippets — and it deliberately includes
// drafts that carry published: false. The rule applies before publication, and
// catching an unowned claim in a draft is cheaper than catching it after. All
// three corpora pass today (31, 105 and 360 files), so this starts green
// everywhere and any failure is new work rather than inherited debt.
//
// Deliberately narrow. It flags appeals to an unnamed authority, not hedging and
// not vagueness in general: content is allowed to say "most people", "usually",
// or "the cheap ones tend to". What it may not do is borrow the credibility of
// testing or expertise it cannot point at.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONTENT_DIR = 'content';

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

// A named source in the same sentence makes the appeal owned, which is the whole
// point of the rule — "Consumer Reports' independent testing" is fine, and so is
// naming the standard a maker tested to.
const NAMED_SOURCE =
  /\b(Consumer Reports|Which\?|Wirecutter|RTINGS|TechRadar|Tom'?s (?:Guide|Hardware)|Digital Trends|Good Housekeeping|Fine Homebuilding|This Old House|Pro Tool Reviews|Tool Box Buzz|Project Farm|AnandTech|Notebookcheck|UL|ASTM|ISO|EN\s?\d|ANSI|NIOSH|EPA|Energy Star)\b/i;

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
          'figure is not published (every claim names who asserts it).',
      );
    }
  }
  return problems;
}

function contentFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...contentFiles(full));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.log(`check-attribution: no ${CONTENT_DIR}/ directory, nothing to check.`);
    return 0;
  }

  const files = contentFiles(CONTENT_DIR);
  const problems = [];

  for (const file of files) {
    for (const msg of attributionProblems(readFileSync(file, 'utf8'))) {
      problems.push(`  ${relative(CONTENT_DIR, file)}\n    ${msg}`);
    }
  }

  if (problems.length > 0) {
    console.error(
      `check-attribution: ${problems.length} unowned claim${
        problems.length === 1 ? '' : 's'
      } across ${files.length} files\n\n${problems.join('\n')}\n`,
    );
    return 1;
  }

  console.log(`check-attribution: ${files.length} files, every claim owned`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) process.exit(main());
