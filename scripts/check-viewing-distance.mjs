#!/usr/bin/env node
/**
 * Viewing Distance Validator
 *
 * Scans article body text for viewing distance recommendations that would result
 * in a field of view below 36° (THX home theater minimum). These claims are the
 * type that get immediately called out on r/hometheater and AVS Forum.
 *
 * Math:
 *   For a 16:9 TV: width_inches = diagonal × (16 / √337) ≈ diagonal × 0.8718
 *   FOV = 2 × atan(width / (2 × distance_inches)) × (180/π)
 *   At 36° (THX min): max_distance_feet = diagonal × 0.8718 × 1.5388 / 12
 *                                        ≈ diagonal × 0.1118
 *   At 40° (optimal 4K): max_distance_feet ≈ diagonal × 0.0998
 *
 * Precomputed max distances where FOV drops below 36° (THX minimum):
 *   43" → 4.8 ft   50" → 5.6 ft   55" → 6.2 ft
 *   65" → 7.3 ft   75" → 8.4 ft   77" → 8.6 ft
 *   85" → 9.5 ft   86" → 9.6 ft
 *
 * Context: Only flags lines that RECOMMEND a distance as ideal/optimal/good.
 * Does NOT flag lines that mention distance in a cautionary or explanatory way.
 *
 * Exit codes:
 *   0 — all OK
 *   1 — one or more errors found
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.resolve("content/articles");

// ─── FOV Math ────────────────────────────────────────────────────────────────

const TV_ASPECT = 16 / Math.sqrt(256 + 81); // 16:9 width fraction = 0.8718

/** Returns the maximum viewing distance in feet before FOV drops below minDegrees */
function maxDistanceFeet(diagonalInches, minDegrees = 36) {
  const widthInches = diagonalInches * TV_ASPECT;
  const halfAngleRad = (minDegrees / 2) * (Math.PI / 180);
  return (widthInches / 2) / Math.tan(halfAngleRad) / 12;
}

/** Returns the FOV in degrees for a given TV size and viewing distance */
function calcFOV(diagonalInches, distanceFeet) {
  const widthInches = diagonalInches * TV_ASPECT;
  const distanceInches = distanceFeet * 12;
  return 2 * Math.atan(widthInches / 2 / distanceInches) * (180 / Math.PI);
}

// Common TV sizes and their max distances (pre-computed for 36° minimum)
const TV_SIZES = [43, 48, 50, 55, 58, 65, 70, 75, 77, 83, 85, 86, 98];
const MAX_DISTANCE_AT_THX_MIN = Object.fromEntries(
  TV_SIZES.map((size) => [size, maxDistanceFeet(size, 36)])
);

// ─── Line Parsing ─────────────────────────────────────────────────────────────

// Words that indicate a positive recommendation (not a description of a problem)
const RECOMMENDATION_RE =
  /\b(ideal|optimal|recommend|good for|perfect for|should sit|want to sit|best to sit|sweet spot|sits?\s+\d+|sitting\s+\d+|approximately|typically|usually|about)\b/i;

// Words that indicate the claim is about too-far or cautionary (skip these lines)
const CAUTION_RE =
  /\b(too far|loses|lose|struggle|strain|sub-thx|below thx|not immersive|not ideal|less immersive|reduces|casual only|feels? (too )?small|starts? feeling|starts? to feel|feeling distant|feels? distant|image.*small|screen.*small|too small for|step up|go bigger|consider \d|if your room|beyond \d+ feet|past \d+ feet)\b/i;

// Regex to capture TV diagonal size from common writing patterns
const TV_SIZE_RE =
  /\b(\d{2})[- ]?(?:inch(?:es)?|"|″|''|in\.)/gi;

// Regex to capture distance in feet from common writing patterns
// Captures the MINIMUM of a range (e.g., "8-10 feet" → 8)
const DISTANCE_RE =
  /\b(\d+(?:\.\d+)?)\s*(?:to|-)\s*\d+(?:\.\d+)?\s*feet|\b(\d+(?:\.\d+)?)\s*(?:\+\s*)?feet/gi;

function extractTVSizes(line) {
  const sizes = [];
  const re = new RegExp(TV_SIZE_RE.source, "gi");
  let m;
  while ((m = re.exec(line)) !== null) {
    const size = parseInt(m[1], 10);
    if (size >= 32 && size <= 120) sizes.push(size);
  }
  return sizes;
}

function extractDistances(line) {
  // Returns all distances found (feet). For ranges like "8-10", returns the minimum.
  const distances = [];
  const re = new RegExp(DISTANCE_RE.source, "gi");
  let m;
  while ((m = re.exec(line)) !== null) {
    const dist = parseFloat(m[1] || m[2]);
    if (dist > 0 && dist < 50) distances.push(dist);
  }
  return distances;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function checkFile(filePath, content) {
  const lines = content.split("\n");
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines that are already framing the issue correctly (caution context)
    if (CAUTION_RE.test(line)) continue;

    // Skip lines without recommendation language
    if (!RECOMMENDATION_RE.test(line)) continue;

    const tvSizes = extractTVSizes(line);
    if (tvSizes.length === 0) continue;

    const distances = extractDistances(line);
    if (distances.length === 0) continue;

    for (const sizeDiag of tvSizes) {
      const maxDist = maxDistanceFeet(sizeDiag, 36);
      for (const dist of distances) {
        if (dist > maxDist + 0.25) {
          // 0.25 ft tolerance for rounding
          const fov = calcFOV(sizeDiag, dist);
          findings.push({
            line: i + 1,
            text: line.trim().substring(0, 120),
            tvSize: sizeDiag,
            distance: dist,
            fov: Math.round(fov * 10) / 10,
            maxOk: Math.round(maxDist * 10) / 10,
          });
        }
      }
    }
  }

  return findings;
}

function main() {
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  let totalErrors = 0;
  const allFindings = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const findings = checkFile(filePath, parsed.content);
    if (findings.length > 0) {
      allFindings.push({ file, findings });
      totalErrors += findings.length;
    }
  }

  if (allFindings.length > 0) {
    for (const { file, findings } of allFindings) {
      for (const f of findings) {
        console.error(`❌ ERROR [viewing-distance] ${file}:${f.line}`);
        console.error(
          `  ${f.tvSize}" TV + ${f.distance} feet → ${f.fov}° FOV (below 36° THX minimum; max ok: ${f.maxOk} ft)`
        );
        console.error(`  Text: "${f.text}"`);
        console.error("");
      }
    }
  }

  const summary = `Viewing distance check: ${totalErrors} error(s) across ${files.length} articles`;
  console.log(summary);

  if (totalErrors > 0) {
    console.error(
      `\n❌ ${totalErrors} viewing distance error(s) found — fix before committing`
    );
    console.error(
      "  Reference: 65\"=7.3ft max, 75\"=8.4ft max, 55\"=6.2ft max (all at 36° THX min)"
    );
    process.exit(1);
  } else {
    console.log("✅ Viewing distance check passed");
  }
}

main();
