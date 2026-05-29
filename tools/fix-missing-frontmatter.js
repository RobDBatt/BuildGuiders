// tools/fix-missing-frontmatter.js
// Scans all MDX articles and adds missing brand/category fields to frontmatter
const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../content/articles');
const BRAND_DEFAULT = 'generic';
const CATEGORY_DEFAULT = 'uncategorized';

let changed = 0;

for (const file of fs.readdirSync(ARTICLES_DIR)) {
  if (!file.endsWith('.mdx')) continue;
  const fullPath = path.join(ARTICLES_DIR, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
  const fmStart = lines.findIndex(l => l.trim() === '---');
  if (fmStart === -1) continue;
  const fmEnd = lines.slice(fmStart + 1).findIndex(l => l.trim() === '---');
  if (fmEnd === -1) continue;
  const fmEndAbs = fmStart + 1 + fmEnd;
  const fm = lines.slice(fmStart + 1, fmEndAbs);
  const hasBrand = fm.some(l => l.trim().startsWith('brand:'));
  const hasCat = fm.some(l => l.trim().startsWith('category:'));
  if (hasBrand && hasCat) continue;
  changed++;
  const newFm = [...fm];
  if (!hasBrand) newFm.push(`brand: ${BRAND_DEFAULT}`);
  if (!hasCat) newFm.push(`category: ${CATEGORY_DEFAULT}`);
  const newLines = [
    ...lines.slice(0, fmStart + 1),
    ...newFm,
    ...lines.slice(fmEndAbs)
  ];
  fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
  console.log(`Patched: ${file}`);
}
console.log(`Patched ${changed} article(s).`);
