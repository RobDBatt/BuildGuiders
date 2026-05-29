#!/usr/bin/env node
/**
 * Power Cycle Time Validator
 * Scans for "wait X seconds" in power cycling contexts and flags anything under 30 seconds.
 * Exits with code 1 if any violations found.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve('content/articles');
const MIN_WAIT_SECONDS = 30;

// Patterns that indicate power cycling context
const POWER_CYCLE_CONTEXT = /\b(unplug|power\s+off|turn\s+off|power\s+cycle|power\s+cycling|shut\s+down|switch\s+off|pull\s+the\s+plug|disconnect\s+from\s+(power|wall|outlet))\b/i;

// Patterns that capture wait times
const WAIT_TIME_PATTERNS = [
  /wait\s+(\d+)\s*seconds?/gi,
  /(\d+)\s*seconds?\s*(wait|before|then)/gi,
  /leave\s+it\s+(?:unplugged\s+)?(?:for\s+)?(\d+)\s*seconds?/gi,
  /(\d+)\s*[-–]\s*second\s+wait/gi,
  /for\s+(?:at\s+least\s+)?(\d+)\s*seconds?/gi,
  /approximately\s+(\d+)\s*seconds?/gi,
  /about\s+(\d+)\s*seconds?/gi,
  /around\s+(\d+)\s*seconds?/gi,
];

function checkPowerCycleTimes(filePath, content) {
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip hold-button patterns (e.g., "hold the power button for 7 seconds" for safe mode)
    if (/\b(hold|press\s+and\s+hold|holding)\b/i.test(line)) continue;
    // Skip remote reset patterns (e.g., "press each button for 5 seconds")
    if (/\b(press\s+each\s+button|press\s+any\s+button)\b/i.test(line)) continue;
    // Skip reset-button patterns (e.g., "hold down the button on the Chromecast for 25 seconds")
    if (/\bhold\s+down\b/i.test(line)) continue;
    // Skip beep/indicator patterns (safe mode entry)
    if (/\bbeep\b/i.test(line)) continue;

    // Check surrounding context (3 lines before and after) for power cycling keywords
    const contextStart = Math.max(0, i - 3);
    const contextEnd = Math.min(lines.length - 1, i + 3);
    const context = lines.slice(contextStart, contextEnd + 1).join(' ');

    if (!POWER_CYCLE_CONTEXT.test(context)) continue;

    for (const pattern of WAIT_TIME_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const seconds = parseInt(match[1], 10);
        if (seconds > 0 && seconds < MIN_WAIT_SECONDS) {
          violations.push({
            line: i + 1,
            seconds,
            text: line.trim().substring(0, 120),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  return violations;
}

function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
  let totalViolations = 0;
  const allViolations = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const violations = checkPowerCycleTimes(filePath, parsed.content);
    if (violations.length > 0) {
      allViolations.push({ file, violations });
      totalViolations += violations.length;
    }
  }

  if (totalViolations > 0) {
    console.error(`\n❌ Power cycle time violations found: ${totalViolations}\n`);
    for (const { file, violations } of allViolations) {
      for (const v of violations) {
        console.error(`  ${file}:${v.line} — says "${v.seconds} seconds" (minimum is ${MIN_WAIT_SECONDS}s)`);
        console.error(`    "${v.text}"`);
        console.error('');
      }
    }
    process.exit(1);
  } else {
    console.log(`✅ Power cycle time check passed (${files.length} articles scanned, minimum ${MIN_WAIT_SECONDS}s enforced)`);
  }
}

main();
