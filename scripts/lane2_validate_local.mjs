import fs from "node:fs";
import path from "node:path";

/**
 * Lane2 local validator (contract v2)
 * - reads targets from: reports/lane2_targets_20.json  { batchSize, picked:[{slug, mdxPath,...}] }
 * - reads originals from: .retrofit-snapshots/LATEST.txt -> <snap>/originals/<slug>.mdx
 * - reads updated from:   content/gadget-guiders/<slug>.mdx (or item.mdxPath)
 *
 * Output: PASS/FAIL per slug + summary counts
 *
 * NOTE:
 * This is a "safety validator" focused on invariants:
 * - slug unchanged
 * - frontmatter unchanged (keys + values)
 * - all links unchanged (http(s) and /articles/*)
 * - required H2 sections present
 * - >=3 "If ... then ..." branches
 * - firmware/software updates late-stage (heuristic)
 * - scope AV gear (heuristic keywords)
 */

const REPO_ROOT = process.cwd();
const TARGETS_PATH = path.join(REPO_ROOT, "reports", "lane2_targets_20.json");
const LATEST_PTR = path.join(REPO_ROOT, ".retrofit-snapshots", "LATEST.txt");

const REQUIRED_H2 = [
    "TL;DR",
    "Quick diagnosis",
    "When this usually happens",
    "Ranked fixes (fastest first)",
    "What usually does NOT help",
    "If it still doesn’t work",
    "Last resort / hardware limitation",
];

function die(msg) {
    console.error(msg);
    process.exit(1);
}

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readText(p) {
    return fs.readFileSync(p, "utf8");
}

function extractFrontmatter(mdx) {
    // very simple YAML frontmatter extraction: first --- ... ---
    const m = mdx.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (!m) return { fmRaw: "", body: mdx };
    return { fmRaw: m[1], body: mdx.slice(m[0].length) };
}

function normalizeNewlines(s) {
    return s.replace(/\r\n/g, "\n");
}

function extractLinks(text) {
    // capture http(s) links + internal /articles/* links
    const links = new Set();

    // http(s) urls
    const httpRe = /https?:\/\/[^\s)>"']+/g;
    for (const m of text.matchAll(httpRe)) links.add(m[0]);

    // /articles/* internal links (markdown or plain)
    const artRe = /\/articles\/[a-z0-9\-\/]+/gi;
    for (const m of text.matchAll(artRe)) links.add(m[0]);

    return [...links].sort();
}

function hasRequiredSections(body) {
    const h2 = new Set();
    const re = /^##\s+(.+)\s*$/gm;
    for (const m of body.matchAll(re)) h2.add(m[1].trim());
    return REQUIRED_H2.every((x) => h2.has(x));
}

function countIfThen(body) {
    // count explicit "If ... then ..." (case-insensitive)
    const re = /\bIf\b[^.\n]{0,200}\bthen\b/gi;
    let c = 0;
    for (const _m of body.matchAll(re)) c++;
    return c;
}

function firmwareLateStage(body) {
    // heuristic: look for "firmware" or "software update" mentions and ensure they appear
    // after "Ranked fixes" heading and not inside first ~25% of the body
    const b = body;
    const idxRanked = b.indexOf("## Ranked fixes (fastest first)");
    if (idxRanked === -1) return false;

    const lower = b.toLowerCase();
    const idxFw = lower.indexOf("firmware");
    const idxSw = lower.indexOf("software update");
    const idxUpdate = idxFw !== -1 ? idxFw : idxSw;

    if (idxUpdate === -1) return true; // no updates mentioned => acceptable

    // must be after ranked fixes heading
    if (idxUpdate < idxRanked) return false;

    // also must not be super early in body
    const cutoff = Math.floor(b.length * 0.25);
    if (idxUpdate < cutoff) return false;

    return true;
}

function scopeLooksAv(body) {
    // light heuristic: should mention TV/HDMI/soundbar/receiver/ARC/eARC/streaming etc.
    const lower = body.toLowerCase();
    const avHits = [
        "tv",
        "hdmi",
        "earc",
        "arc",
        "soundbar",
        "receiver",
        "avr",
        "dolby",
        "atmos",
        "stream",
        "wifi",
        "router",
        "console",
    ].filter((k) => lower.includes(k)).length;

    // avoid obviously non-AV content
    const nonAvHits = ["resume", "payroll", "tax", "vba", "python"].filter((k) =>
        lower.includes(k)
    ).length;

    return avHits >= 3 && nonAvHits === 0;
}

function main() {
    if (!fs.existsSync(TARGETS_PATH)) die(`Missing targets: ${TARGETS_PATH}`);
    if (!fs.existsSync(LATEST_PTR)) die(`Missing snapshot pointer: ${LATEST_PTR}`);

    const snapRoot = readText(LATEST_PTR).trim();
    if (!snapRoot) die(`LATEST.txt is empty: ${LATEST_PTR}`);

    const targets = readJson(TARGETS_PATH);
    const picked = Array.isArray(targets?.picked) ? targets.picked : [];
    if (!picked.length) die(`No picked targets in: ${TARGETS_PATH}`);

    let pass = 0;
    let fail = 0;

    const results = [];

    for (const item of picked) {
        const slug = item.slug;
        if (!slug) continue;

        const origPath = path.join(snapRoot, "originals", `${slug}.mdx`);
        const updatedPath = item.mdxPath
            ? path.resolve(item.mdxPath)
            : path.join(REPO_ROOT, "content", "gadget-guiders", `${slug}.mdx`);

        const r = {
            slug,
            original: origPath,
            updated: updatedPath,
            checks: {},
        };

        if (!fs.existsSync(origPath)) {
            r.checks.original_exists = false;
            r.checks.updated_exists = fs.existsSync(updatedPath);
            r.status = "FAIL";
            results.push(r);
            fail++;
            continue;
        }
        if (!fs.existsSync(updatedPath)) {
            r.checks.original_exists = true;
            r.checks.updated_exists = false;
            r.status = "FAIL";
            results.push(r);
            fail++;
            continue;
        }

        const orig = normalizeNewlines(readText(origPath));
        const upd = normalizeNewlines(readText(updatedPath));

        const o = extractFrontmatter(orig);
        const u = extractFrontmatter(upd);

        // Check 1: slug unchanged (frontmatter raw contains slug line exact match)
        const slugRe = /^slug:\s*["']?(.+?)["']?\s*$/m;
        const oSlug = (o.fmRaw.match(slugRe)?.[1] || "").trim();
        const uSlug = (u.fmRaw.match(slugRe)?.[1] || "").trim();
        r.checks.slug_same = !!oSlug && oSlug === uSlug;

        // Check 2: frontmatter unchanged (raw string compare)
        r.checks.frontmatter_same = o.fmRaw.trim() === u.fmRaw.trim();

        // Check 3: links unchanged (all http(s) + /articles/*)
        const oLinks = extractLinks(orig);
        const uLinks = extractLinks(upd);
        r.checks.links_same =
            oLinks.length === uLinks.length &&
            oLinks.every((x, i) => x === uLinks[i]);

        // Check 4: required H2 sections present
        r.checks.required_sections = hasRequiredSections(u.body);

        // Check 5: >= 3 if/then branches
        const ifThen = countIfThen(u.body);
        r.checks.if_then_count = ifThen >= 3;
        r.if_then_count = ifThen;

        // Check 6: firmware updates late-stage only (heuristic)
        r.checks.firmware_late_stage = firmwareLateStage(u.body);

        // Check 7: scope AV gear (heuristic)
        r.checks.scope_av = scopeLooksAv(u.body);

        const ok =
            r.checks.slug_same &&
            r.checks.frontmatter_same &&
            r.checks.links_same &&
            r.checks.required_sections &&
            r.checks.if_then_count &&
            r.checks.firmware_late_stage &&
            r.checks.scope_av;

        r.status = ok ? "PASS" : "FAIL";
        results.push(r);

        if (ok) pass++;
        else fail++;
    }

    // Print summary + details
    console.log(`Lane2 Validate (contract v2)`);
    console.log(`Targets: ${picked.length}`);
    console.log(`PASS: ${pass}`);
    console.log(`FAIL: ${fail}`);
    console.log("");

    for (const r of results) {
        const badge = r.status === "PASS" ? "✅" : "❌";
        console.log(`${badge} ${r.slug} -> ${r.status}`);
        if (r.status !== "PASS") {
            console.log(`   slug_same: ${r.checks.slug_same}`);
            console.log(`   frontmatter_same: ${r.checks.frontmatter_same}`);
            console.log(`   links_same: ${r.checks.links_same}`);
            console.log(`   required_sections: ${r.checks.required_sections}`);
            console.log(`   if_then>=3: ${r.checks.if_then_count} (count=${r.if_then_count ?? 0})`);
            console.log(`   firmware_late_stage: ${r.checks.firmware_late_stage}`);
            console.log(`   scope_av: ${r.checks.scope_av}`);
        }
    }

    // Write a machine-readable report
    const outDir = path.join(REPO_ROOT, "reports");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "lane2_validate_report.json");
    fs.writeFileSync(outPath, JSON.stringify({ pass, fail, results }, null, 2), "utf8");
    console.log(`\nReport written: ${outPath}`);

    process.exit(fail > 0 ? 2 : 0);
}

main();
