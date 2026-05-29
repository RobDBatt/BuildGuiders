const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: node scripts/validate_one_article_safe.cjs <path-to-mdx>");
    process.exit(2);
}

try {
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
    // We scan for "If" followed by "then" within ~160 chars
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
        } else {
            firmwareLateOk = true;
        }
    }

    // 5) quick check: no mojibake tokens
    // Using hex escapes to avoid source encoding issues:
    // Mojibake commonly involves C2/C3/E2 bytes interpreted as ANSI.
    // e.g. \u00C2 (Â), \u00E2 (â), \u00C3 (Ã)
    // We'll just look for common suspect distinct sequences if possible, or broad ranges.
    // Ideally we want to match: "ΓÇ", "â€”", "â€™", "Â "
    // "ΓÇ" = \u0393\u00C7
    // "â€”" = \u00E2\u20AC\u201D
    // "â€™" = \u00E2\u20AC\u2122
    // "Â " = \u00C2\u0020
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
