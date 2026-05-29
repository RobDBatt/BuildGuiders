#!/usr/bin/env node
import fs from "fs";
import path from "path";

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: node scripts/validate_one_article.mjs <path-to-mdx>");
    process.exit(2);
}

const text = fs.readFileSync(filePath, "utf8");

// 1) slug exists
const slugMatch = text.match(/(?m)^\s*slug:\s*["']?([^"' \r\n]+)["']?\s*$/);
const slugOk = !!slugMatch;

// 2) required headings
const headings = [
    /^##\s*TL;DR\b/im,
    /^##\s*Quick diagnosis\b/im,
    /^##\s*When this usually happens\b/im,
    /^##\s*Ranked fixes\b/im,
    /^##\s*What usually does NOT help\b/im,
    /^##\s*Last resort\b/im,
];
const headingResults = headings.map((re) => re.test(text));
const headingsOk = headingResults.every(Boolean);

// 3) at least 3 "If ... then ..." branches (loose but useful)
const ifThenCount = (text.match(/\bIf\b[\s\S]{0,160}\bthen\b/gi) || []).length;
const ifThenOk = ifThenCount >= 3;

// 4) firmware late-stage: check that "Firmware" section (if present) occurs after Ranked fixes start
const rankedIdx = text.search(/^##\s*Ranked fixes\b/im);
// Look for "Firmware" specifically in a heading after Ranked Fixes starts
// This is imprecise but catches "### 1. Update Firmware" if rankedIdx is before it.
// We search for "firmware" anywhere. If it appears BEFORE ranked fixes line, that is suspicious.
// BUT "Firmware" might appear in "TL;DR" or "When this happens" harmlessly.
// Let's stick to the prompt's logic: "Firmware" section occurs after Ranked fixes start.
// We'll search for "### .*Firmware" or similar heading patterns.
const firmwareHeadingRe = /#{2,6}\s+.*Firmware/i;
const firmwareHeadingMatch = text.match(firmwareHeadingRe);
let firmwareLateOk = true;

if (firmwareHeadingMatch) {
    const firmwarePos = firmwareHeadingMatch.index;
    // If we found a firmware HEADING, it must be AFTER "Ranked fixes"
    // And ideally not the FIRST item under Ranked Fixes (which is hard to regex purely)
    // For now, simple check: is it after rankedIdx?
    if (rankedIdx === -1 || firmwarePos < rankedIdx) {
        // It's before ranked fixes or ranked fixes missing -> fail
        // (Unless it's in TL;DR? The prompt implies strictness. Let's assume fail if before.)
        firmwareLateOk = false;
    } else {
        // It is after Ranked Fixes.
        // Validating "late stage" via regex is hard (is it step 1 or 5?).
        // We will assume PASS if it is after Ranked Fixes for this simple script.
        firmwareLateOk = true;
    }
}

// 5) quick check: no mojibake tokens
const mojibake = /ΓÇ|â€”|â€™|Â\s/.test(text);

const report = {
    file: path.resolve(filePath),
    slug: slugMatch ? slugMatch[1] : null,
    checks: {
        slug_present: slugOk,
        required_headings_present: headingsOk,
        if_then_branches_ge_3: ifThenOk,
        firmware_is_late_stage: firmwareLateOk,
        mojibake_tokens_present: !mojibake,
    },
    metrics: { ifThenCount },
};

const allPass = Object.values(report.checks).every(Boolean);

console.log(JSON.stringify(report, null, 2));
console.log(allPass ? "\nVALIDATED: SAFE TO COMMIT" : "\nVALIDATION: FAIL");
process.exit(allPass ? 0 : 1);
