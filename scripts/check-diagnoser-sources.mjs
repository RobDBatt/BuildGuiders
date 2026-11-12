#!/usr/bin/env node
// Enforces the attribution rule on /deck-stain-problems (AGENTS.md: every
// claim names who asserts it, or says the figure is not published).
//
// Rule: any line on the page that contains a digit must carry a `source`
// field. The source is either a named publisher with a URL, or null, which
// the page renders as "not published". A figure with no source field at all
// fails the build.
//
// It also fails if a guide the page links to does not exist, so the hub can't
// point at a retired slug.
//
// Imports the data file directly; Node 24 strips the TypeScript types.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROBLEMS } from '../lib/deck-stain-problems.ts';

const problems = [];
const hasDigit = (s) => /\d/.test(s);

function checkLine(where, line) {
  if (!line) return;
  if (hasDigit(line.text) && !('source' in line)) {
    problems.push(`  ${where}: "${line.text.slice(0, 80)}…" has a figure and no source.`);
  }
  if (line.source && (!line.source.name || !/^https:\/\//.test(line.source.url || ''))) {
    problems.push(`  ${where}: source needs a name and an https URL.`);
  }
}

for (const p of PROBLEMS) {
  for (const field of ['symptom', 'summary']) {
    if (hasDigit(p[field])) {
      problems.push(`  ${p.id}.${field}: figures belong in a sourced line, not the ${field}.`);
    }
  }
  p.checks.forEach((c, i) => {
    if (hasDigit(c.sign)) problems.push(`  ${p.id}.checks[${i}].sign: figures belong in the sourced cause.`);
    checkLine(`${p.id}.checks[${i}].cause`, c.cause);
  });
  p.fixes.forEach((f, i) => checkLine(`${p.id}.fixes[${i}]`, f));
  checkLine(`${p.id}.note`, p.note);
  if (!existsSync(join('content', 'articles', `${p.guide.slug}.mdx`))) {
    problems.push(`  ${p.id}: links to guide "${p.guide.slug}", which is not a live article.`);
  }
}

if (problems.length) {
  console.error('check-diagnoser-sources: /deck-stain-problems has unattributed figures:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`check-diagnoser-sources: ${PROBLEMS.length} problems, every figure sourced`);
