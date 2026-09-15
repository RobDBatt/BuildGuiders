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
// Trailing participial clauses per 1,000 words. All 27 hand-written articles
// score exactly 0; the three generated under the rewritten prompt scored 3.6,
// 8.1 and 10.3. Three leaves real headroom over a corpus sitting at zero.
const MAX_SIGNIFICANCE_CLAUSES_PER_1K = 3;

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

  // Truncation. A model that hits its output cap stops mid-sentence, and the
  // result still clears every check above — run 34799314869 wrote a 661-word
  // stump that passed the word count while missing its whole back half. Two
  // signals, because either can appear alone: the closing section can be there
  // with the last sentence still cut, or the cut can land before it.
  if (!/^##\s+Bottom Line\s*$/m.test(body)) {
    note(
      file,
      'has no "## Bottom Line" section. Every article is prompted to end with ' +
        'one, so its absence means the response was cut short.',
    );
  }

  const lastLine = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .pop();
  // Prose ends in a full stop; a related-guides list item ends in a link's ")".
  if (lastLine && !/[.!?)"'`\]]$/.test(lastLine)) {
    note(
      file,
      `ends mid-sentence: "...${lastLine.slice(-60)}". The response was cut off.`,
    );
  }

  // Trailing participial clauses that restate significance — "...resists
  // scuffing, making it suitable for high-traffic areas". The measured
  // structural tell: LLM prose carries them at 2-5x human rate, and the fix is
  // deletion, because the sentence was finished before the clause started.
  //
  // Rewriting the prompt to forbid these did nothing — 22 occurrences before,
  // 24 after. What gets a check behind it holds; what is merely asked for
  // drifts. That is the whole reason this is a gate and not another bullet in
  // the prompt.
  //
  // Rate-based rather than absolute, and requires at least two, so one
  // legitimate use in a short article is not a failure.
  const significanceClauses = [
    ...body.matchAll(
      /,\s+(making|ensuring|providing|offering|allowing|helping|requiring|creating|delivering|giving)\s+/gi,
    ),
  ];
  const clausesPer1k = words > 0 ? (significanceClauses.length * 1000) / words : 0;
  if (
    significanceClauses.length >= 2 &&
    clausesPer1k > MAX_SIGNIFICANCE_CLAUSES_PER_1K
  ) {
    const sample = significanceClauses[0][0].trim();
    note(
      file,
      `has ${significanceClauses.length} trailing "${sample}"-style clauses ` +
        `(${clausesPer1k.toFixed(1)} per 1k words, max ` +
        `${MAX_SIGNIFICANCE_CLAUSES_PER_1K}). They restate significance the ` +
        'sentence already earned — delete them rather than rewriting.',
    );
  }

  // The labelled-field template. The prompt forbids it, and a prompt is a
  // request rather than a guarantee — run 34800859208 produced "**Best for:**
  // / **Key Features:** / **Caveat:**" under every product heading, which is
  // the most recognisable machine-writing tell in the piece.
  //
  // Requires a colon inside the bold, so an ordinary editorial lead-in like
  // "**Wood-plastic composite** is ground wood fibre..." is untouched. Flags at
  // two or more, because the tell is the repetition.
  const fieldLabels = [...body.matchAll(/^\s*\*\*[A-Z][^*\n]{2,30}:\*\*/gm)].map((m) =>
    m[0].trim(),
  );
  if (fieldLabels.length >= 2) {
    note(
      file,
      `uses a labelled-field template ${fieldLabels.length} times ` +
        `(${[...new Set(fieldLabels)].slice(0, 3).join(' ')}). Write it as prose.`,
    );
  }

  // The calculator cross-link. Every article is prompted to send the reader to
  // its category calculator in the closing section, and the cross-link is a real
  // part of why the article exists. Run 34800859208 wrote "Run your measurements
  // through our free paint calculator" as plain prose in two of three articles —
  // the sentence is there, the link is not, so the CTA goes nowhere and reads as
  // an oversight to anyone who tries to click it.
  //
  // Checks for the mention rather than demanding one: the template renders its
  // own CTA from categoryCalculators, and none of the 27 hand-written articles
  // links a calculator in the body, so requiring it would be a rule the corpus
  // itself breaks. Naming one without linking it is the actual defect.
  if (/\bcalculator\b/i.test(body) && !/\]\(\/[a-z-]+-calculator\)/.test(body)) {
    note(
      file,
      'mentions a calculator but never links one. Write it as a markdown link ' +
        'to the route (e.g. "[paint calculator](/paint-calculator)") — as plain ' +
        'text the cross-link does nothing.',
    );
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
