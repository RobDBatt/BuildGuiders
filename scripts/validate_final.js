const fs = require("fs");
const path = require("path");

console.log("Starting validation...");

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: node scripts/validate_final.js <path-to-mdx>");
    process.exit(2);
}

try {
    const text = fs.readFileSync(filePath, "utf8");
    console.log(`Read file: ${filePath} (${text.length} bytes)`);

    // 1) slug exists
    // JS Regex: use /m flag at end, not (?m)
    const slugMatch = text.match(/^\s*slug:\s*["']?([^"' \r\n]+)["']?\s*$/m);
    const slugOk = !!slugMatch;

    // 2) required headings
    // Ensure case insensitive 'i' and multiline 'm' if needed (though anchors work on lines with 'm')
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

    // 4) firmware late-stage
    const rankedIdx = text.search(/^##\s*Ranked fixes\b/im);
    const firmwareHeadingRe = /#{2,6}\s+.*Firmware/i;
    const firmwareHeadingMatch = text.match(firmwareHeadingRe);
    let firmwareLateOk = true;

    if (firmwareHeadingMatch) {
        const firmwarePos = firmwareHeadingMatch.index;
        if (rankedIdx === -1 || firmwarePos < rankedIdx) {
            firmwareLateOk = false;
        }
    }

    // 5) quick check: no mojibake tokens
    const mojibakeRegex = /\u0393\u00C7|\u00E2\u20AC\u201D|\u00E2\u20AC\u2122|\u00C2\u0020/;
    const mojibake = mojibakeRegex.test(text);

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

} catch (err) {
    console.error("FATAL ERROR:", err);
    process.exit(1);
}
