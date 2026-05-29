#!/usr/bin/env node
/**
 * Format Support Claims Validator — BuildGuiders (HVAC niche)
 * Scans article body text for false HVAC claims.
 * Exits with code 1 if any errors found; warnings are non-fatal.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve('content/articles');

// Negation patterns to skip lines with explicit negations
const NEGATION_RE = /does\s*n[o']t|doesn't|not\s+recommended|without|cannot|can't|should\s+not|must\s+not|never|illegal|requires?\s+(a\s+)?license|licensed\s+technician/i;

const RULES = [
  {
    name: 'DIY refrigerant without EPA 608 caveat',
    level: 'error',
    test(line) {
      if (NEGATION_RE.test(line)) return false;
      // Flag lines that suggest adding/handling refrigerant without a license caveat
      const hasRefrigerant = /(?:add|recharge|refill|top[- ]?off|charge)\s+(?:the\s+)?refrigerant/i.test(line) ||
                             /refrigerant\s+(?:leak|recharge|refill|top[- ]?off)/i.test(line);
      const hasEPA = /epa\s*608|licensed\s+(?:hvac|technician|contractor)|certified\s+technician/i.test(line);
      return hasRefrigerant && !hasEPA;
    },
    message: 'Refrigerant work requires EPA 608 certification — always say "contact a licensed HVAC technician" for refrigerant issues',
  },
  {
    name: 'SEER (old standard) without SEER2 note',
    level: 'warning',
    test(line) {
      // Flag SEER ratings cited without noting SEER2 is current standard (post-2023)
      // Only flag if SEER appears as a standalone rating claim without SEER2 mention
      const hasSeer = /\b(\d+)\s*SEER\b/i.test(line);
      const hasSeer2 = /SEER2/i.test(line);
      return hasSeer && !hasSeer2;
    },
    message: 'SEER2 is the current efficiency standard (replaced SEER in Jan 2023) — note this when citing efficiency ratings',
  },
  {
    name: 'Heat pump works normally in extreme cold (below -22F)',
    level: 'error',
    test(line) {
      if (NEGATION_RE.test(line)) return false;
      // Flag claims that standard heat pumps work normally below -22F / -30C
      const hasExtremeTemp = /below\s+-(?:2[2-9]|[3-9]\d)\s*[°]?\s*[Ff]|below\s+-(?:3[0-9]|[4-9]\d)\s*[°]?\s*[Cc]/i.test(line);
      const hasNormal = /(?:works?\s+normally|runs?\s+normally|operates?\s+normally|efficient|no\s+problem|without\s+issue)/i.test(line);
      return hasExtremeTemp && hasNormal;
    },
    message: 'Standard heat pumps shut down below -22F / -30C — only Hyper-heat models rated for extreme cold',
  },
  {
    name: 'Wait time under 30 seconds for power cycling HVAC equipment',
    level: 'error',
    test(line) {
      // Match "wait X seconds" where X is under 30 in a power cycling context
      const powerCycleContext = /(?:power\s*cycle|restart|reboot|unplug|turn\s+off\s+and|circuit\s+breaker|disconnect|hard\s+reset)/i.test(line);
      if (!powerCycleContext) return false;
      const waitMatch = line.match(/wait\s+(\d+)\s*(?:to\s+\d+\s*)?seconds?/i);
      if (!waitMatch) return false;
      const seconds = parseInt(waitMatch[1], 10);
      return seconds < 30;
    },
    message: 'Power cycling HVAC equipment requires 30 seconds minimum wait (capacitors need time to discharge)',
  },
];

function checkFormatClaims(filePath, data, content) {
  const errors = [];
  const warnings = [];
  const brand = (data.brand || '').toLowerCase();
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const rule of RULES) {
      try {
        if (rule.test(line, brand)) {
          const entry = {
            line: lineNum,
            text: line.trim().substring(0, 120),
            rule: rule.name,
            message: rule.message,
          };
          if (rule.level === 'error') {
            errors.push(entry);
          } else {
            warnings.push(entry);
          }
        }
      } catch {
        // Skip rule errors
      }
    }
  }

  return { errors, warnings };
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('✅ No articles directory found — skipping format claims check');
    process.exit(0);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));

  if (files.length === 0) {
    console.log('✅ No articles found — format claims check skipped');
    process.exit(0);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const allIssues = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const { errors, warnings } = checkFormatClaims(filePath, parsed.data, parsed.content);
    if (errors.length > 0 || warnings.length > 0) {
      allIssues.push({ file, errors, warnings });
      totalErrors += errors.length;
      totalWarnings += warnings.length;
    }
  }

  if (totalWarnings > 0) {
    console.warn(`\n⚠️  Format claim warnings: ${totalWarnings}\n`);
    for (const { file, warnings } of allIssues) {
      if (warnings.length === 0) continue;
      console.warn(`  ${file}:`);
      for (const w of warnings) {
        console.warn(`    - Line ${w.line}: [${w.rule}] ${w.message}`);
        console.warn(`      "${w.text}"`);
      }
    }
  }

  if (totalErrors > 0) {
    console.error(`\n❌ Format claim errors found: ${totalErrors}\n`);
    for (const { file, errors } of allIssues) {
      if (errors.length === 0) continue;
      console.error(`  ${file}:`);
      for (const e of errors) {
        console.error(`    - Line ${e.line}: [${e.rule}] ${e.message}`);
        console.error(`      "${e.text}"`);
      }
    }
    console.error('');
    process.exit(1);
  } else {
    console.log(`✅ Format claims check passed (${files.length} articles scanned, ${totalWarnings} warnings)`);
  }
}

main();
