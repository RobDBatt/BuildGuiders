#!/usr/bin/env node
// Lists the Gemini models this API key can actually reach, so GEMINI_MODEL can
// be set to something real rather than something that looked right in a blog
// post. Model names move quickly and a wrong one fails at the first article.
//
//   npm run models
//
// Ported from tools/list-gemini-models.mjs on the old branch, with the key moved
// out of the query string and into a header: a key in a URL ends up in shell
// history, proxy logs and CI output, and this one is meant to stay in a secret.

import "dotenv/config";

const KEY = process.env.GEMINI_API_KEY;

if (!KEY) {
  console.error('GEMINI_API_KEY is not set. Put it in .env.local or the environment.');
  process.exit(1);
}

const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
  headers: { 'x-goog-api-key': KEY },
});

if (!res.ok) {
  console.error(`Gemini API returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const { models = [] } = await res.json();

// Only the ones this script could actually generate an article with.
const usable = models.filter((m) =>
  (m.supportedGenerationMethods ?? []).includes('generateContent')
);

if (usable.length === 0) {
  console.log('No models supporting generateContent are available to this key.');
  process.exit(0);
}

console.log(`${usable.length} model(s) supporting generateContent:\n`);
for (const m of usable) {
  // The list endpoint returns "models/gemini-x"; GEMINI_MODEL wants the bare id.
  const id = m.name.replace(/^models\//, '');
  console.log(`  ${id}`);
  if (m.displayName && m.displayName !== id) console.log(`    ${m.displayName}`);
}
console.log('\nSet one of these as GEMINI_MODEL (repository variable, or .env.local).');
