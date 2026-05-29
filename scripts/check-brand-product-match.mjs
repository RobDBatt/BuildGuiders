#!/usr/bin/env node
/**
 * Brand-Product Mismatch Validator — BuildGuiders (HVAC niche)
 * Cross-references each article's brand and slug against a known HVAC product matrix.
 * Exits with code 1 if any mismatches found.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve('content/articles');

// Mini-split / heat pump brands — these do NOT make smart thermostats or tankless water heaters
const MINI_SPLIT_BRANDS = new Set([
  'mrcool', 'mitsubishi', 'daikin', 'pioneer', 'senville', 'gree', 'midea',
  'cooper-hunter', 'cooper hunter', 'bosch-hvac', 'bosch hvac', 'friedrich',
  'carrier', 'lennox', 'trane', 'goodman', 'lg-hvac', 'lg hvac',
]);

// Smart thermostat brands — these do NOT make mini-splits or water heaters
const THERMOSTAT_BRANDS = new Set([
  'ecobee', 'honeywell', 'honeywell-home', 'nest', 'google-nest', 'sensi',
  'emerson', 'lux', 'wyze',
]);

// Tankless water heater brands — these do NOT make mini-splits or thermostats
const WATER_HEATER_BRANDS = new Set([
  'navien', 'rinnai', 'noritz', 'takagi', 'rheem', 'ao-smith', 'bradford-white',
  'stiebel-eltron', 'ecosmart', 'a.o. smith',
]);

// Window AC brands (some overlap with mini-split brands, handled carefully)
const WINDOW_AC_BRANDS = new Set([
  'frigidaire', 'homelabs', 'black-decker', 'black+decker', 'toshiba-ac', 'haier',
]);

// Brands that do NOT make mini-splits
const NO_MINI_SPLITS = new Set([
  ...THERMOSTAT_BRANDS,
  ...WATER_HEATER_BRANDS,
  ...WINDOW_AC_BRANDS,
]);

// Brands that do NOT make smart thermostats
const NO_THERMOSTATS = new Set([
  ...MINI_SPLIT_BRANDS,
  ...WATER_HEATER_BRANDS,
]);

// Brands that do NOT make tankless water heaters
const NO_WATER_HEATERS = new Set([
  ...MINI_SPLIT_BRANDS,
  ...THERMOSTAT_BRANDS,
  ...WINDOW_AC_BRANDS,
]);

// Mains-powered HVAC devices — no batteries to drain (main units)
const MAINS_POWERED_CATEGORIES = new Set([
  'mini-splits', 'water-heaters', 'window-ac', 'portable-ac', 'air-quality',
]);

function checkBrandProductMatch(filePath, data, content) {
  const errors = [];
  const brand = (data.brand || '').toLowerCase();
  const slug = (data.slug || '').toLowerCase();
  const category = (data.category || '').toLowerCase();

  // Check brand-doesn't-make-mini-splits
  if (NO_MINI_SPLITS.has(brand) && category === 'mini-splits') {
    errors.push(`Brand "${data.brand}" does not make mini-splits, but article is categorized as mini-split content`);
  }

  // Check brand-doesn't-make-smart-thermostats
  if (NO_THERMOSTATS.has(brand) && category === 'smart-thermostats') {
    errors.push(`Brand "${data.brand}" does not make smart thermostats, but article is categorized as thermostat content`);
  }

  // Check brand-doesn't-make-water-heaters
  if (NO_WATER_HEATERS.has(brand) && category === 'water-heaters') {
    errors.push(`Brand "${data.brand}" does not make tankless water heaters, but article is categorized as water heater content`);
  }

  // Check mains-powered devices with battery-drain advice (for main unit, not remote/thermostat)
  if (MAINS_POWERED_CATEGORIES.has(category)) {
    const batteryPatterns = [
      /replace\s+(the\s+)?batteries/i,
      /check\s+(the\s+)?batteries/i,
      /batteries\s+(are|might be|could be|may be)\s+(dead|low|drained|dying)/i,
      /insert\s+fresh\s+batteries/i,
    ];
    for (const pattern of batteryPatterns) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.test(line)) {
          const lineLower = line.toLowerCase();
          // Skip if line references a remote or thermostat (those DO have batteries)
          if (lineLower.includes('remote') || lineLower.includes('thermostat')) continue;
          const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 3)).join(' ').toLowerCase();
          if (context.includes('remote') || context.includes('thermostat')) continue;
          if (slug.includes('remote') || slug.includes('thermostat')) continue;
          errors.push(`Line ${i + 1}: Battery advice for mains-powered ${category} device: "${line.trim().substring(0, 80)}"`);
        }
      }
    }
  }

  return errors;
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('✅ No articles directory found — skipping brand-product match check');
    process.exit(0);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));

  if (files.length === 0) {
    console.log('✅ No articles found — brand-product match check skipped');
    process.exit(0);
  }

  let totalErrors = 0;
  const allErrors = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const errors = checkBrandProductMatch(filePath, parsed.data, parsed.content);
    if (errors.length > 0) {
      allErrors.push({ file, errors });
      totalErrors += errors.length;
    }
  }

  if (totalErrors > 0) {
    console.error(`\n❌ Brand-product mismatch errors found: ${totalErrors}\n`);
    for (const { file, errors } of allErrors) {
      console.error(`  ${file}:`);
      for (const err of errors) {
        console.error(`    - ${err}`);
      }
    }
    console.error('');
    process.exit(1);
  } else {
    console.log(`✅ Brand-product match check passed (${files.length} articles scanned)`);
  }
}

main();
