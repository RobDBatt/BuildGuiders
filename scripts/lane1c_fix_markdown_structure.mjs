#!/usr/bin/env node
/**
 * Lane 1C — Mechanical markdown/MDX structure cleanup (no content rewriting).
 *
 * What it does:
 * - Converts common section labels into proper "##" headings when they appear as plain lines.
 * - Under a TL;DR section, converts consecutive plain lines into "- " bullets (only if they are not already bullets/numbered).
 * - Removes a trailing orphan heading like "## 5. When it's still not working" ONLY if it's empty (no content below).
 *
 * What it does NOT do:
 * - Does NOT change frontmatter values.
 * - Does NOT change links.
 * - Does NOT reorder steps.
 * - Does NOT add new claims.
 *
 * Safety:
 * - Creates a .bak copy unless --no-backup is used.
 * - Supports --dry-run to preview changes.
 *
 * Usage:
 *   node scripts/lane1c_fix_markdown_structure.mjs
 *   node scripts/lane1c_fix_markdown_structure.mjs --root "C:\Sites-Vercel\BuildGuiders" --dry-run
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
    const i = args.indexOf(name);
    return i >= 0 ? (args[i + 1] ?? fallback) : fallback;
};
const hasFlag = (name) => args.includes(name);

const ROOT = getArg("--root", process.cwd());
const CONTENT_REL = getArg("--content", "content/gadget-guiders");
const DRY_RUN = hasFlag("--dry-run");
const NO_BACKUP = hasFlag("--no-backup");
const REPORT_PATH = getArg("--report", path.join(ROOT, "lane1c_markdown_structure_report.csv"));

const CONTENT_DIR = path.join(ROOT, CONTENT_REL);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (["node_modules", ".git", ".next", "dist", "build"].includes(ent.name)) continue;
            walk(p, out);
        } else if (ent.isFile() && p.toLowerCase().endsWith(".mdx")) {
            out.push(p);
        }
    }
    return out;
}

function splitFrontmatter(text) {
    const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!m) return { hasFM: false, fm: "", body: text };
    return { hasFM: true, fm: m[1], body: m[2] };
}

const HEADING_LABELS = new Map([
    ["TL;DR", "## TL;DR"],
    ["Quick diagnosis", "## Quick diagnosis"],
    ["When this usually happens", "## When this usually happens"],
    ["Ranked fixes (fastest first)", "## Ranked fixes (fastest first)"],
    ["Ranked fixes", "## Ranked fixes"],
    ["Brand-specific tweaks", "## Brand-specific tweaks"],
    ["Reliable wiring patterns", "## Reliable wiring patterns"],
    ["What usually does NOT help", "## What usually does NOT help"],
    ["If it still doesn't work", "## If it still doesn't work"],
    ["If it still doesn’t work", "## If it still doesn’t work"],
    ["Last resort / hardware limitation", "## Last resort / hardware limitation"],
]);

function isHeading(line) {
    return /^\s*#{1,6}\s+/.test(line);
}
function isBullet(line) {
    return /^\s*[-*]\s+/.test(line);
}
function isNumbered(line) {
    return /^\s*\d+\.\s+/.test(line);
}
function isBlank(line) {
    return line.trim() === "";
}

function fixBody(body) {
    const lines = body.split("\n");
    let changed = false;

    // 1) Convert label lines into headings when line matches exactly
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (HEADING_LABELS.has(trimmed)) {
            // Only convert if it's not already a heading
            if (!isHeading(raw)) {
                lines[i] = HEADING_LABELS.get(trimmed);
                changed = true;
            }
        }
    }

    // 2) Under TL;DR, convert plain lines into bullets until next heading
    // Find "## TL;DR" (or "# TL;DR")
    let tldrIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*##\s*TL;DR\b/.test(lines[i]) || /^\s*#\s*TL;DR\b/.test(lines[i])) {
            tldrIdx = i;
            break;
        }
    }
    if (tldrIdx >= 0) {
        for (let i = tldrIdx + 1; i < lines.length; i++) {
            // Stop when next heading starts
            if (isHeading(lines[i])) break;

            // Skip blank lines
            if (isBlank(lines[i])) continue;

            // If it's already a list item or numbered, leave it
            if (isBullet(lines[i]) || isNumbered(lines[i])) continue;

            // If it looks like a paragraph sentence (contains a period) AND is long, leave it (likely the TL;DR intro sentence)
            const t = lines[i].trim();
            if (t.length > 80 && t.includes(".")) continue;

            // Otherwise convert to bullet
            lines[i] = `- ${t}`;
            changed = true;
        }
    }

    // 3) Remove trailing orphan headings like "## 5. When it's *still* not working" if empty
    // We only remove if it is the last non-blank content and nothing follows it.
    // (This avoids deleting real content.)
    const lastNonBlankIndex = (() => {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (!isBlank(lines[i])) return i;
        }
        return -1;
    })();

    if (lastNonBlankIndex >= 0) {
        const lastLine = lines[lastNonBlankIndex];
        if (/^\s*#{1,6}\s*\d+\.\s+When it['’]s\s+\*?still\*?\s+not\s+working\b/i.test(lastLine)) {
            // orphan heading at end → remove
            lines.splice(lastNonBlankIndex, 1);
            changed = true;
        }
    }

    return { body: lines.join("\n"), changed };
}

const files = walk(CONTENT_DIR);
let changedCount = 0;
const reportRows = [];

for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const { hasFM, fm, body } = splitFrontmatter(original);

    const fixedBody = fixBody(body);
    if (!fixedBody.changed) continue;

    const updated = hasFM ? `---\n${fm}\n---\n${fixedBody.body}` : fixedBody.body;

    changedCount++;
    reportRows.push({
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        change: "normalized headings and TL;DR bullets (structure-only)",
    });

    if (!DRY_RUN) {
        if (!NO_BACKUP) fs.writeFileSync(filePath + ".bak", original, "utf8");
        fs.writeFileSync(filePath, updated, "utf8");
    }
}

function toCsv(rows) {
    const header = ["file", "change"];
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    return [header.join(","), ...rows.map((r) => header.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}

const csv = toCsv(reportRows);
if (!DRY_RUN) fs.writeFileSync(REPORT_PATH, csv, "utf8");

console.log(`Lane 1C (markdown structure) scan: ${files.length} files`);
console.log(`Changed: ${changedCount} file(s)`);
console.log(DRY_RUN ? "Dry run only (no files written)." : `Report: ${REPORT_PATH}`);

process.exit(0);
