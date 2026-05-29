#!/usr/bin/env node
/**
 * Lane 1B — Fix malformed YAML tags blocks in MDX frontmatter (format-only).
 *
 * What it does:
 * - Only touches the `tags:` field inside frontmatter (--- ... ---).
 * - If `tags:` is present but followed by plain lines (not '- item'), it converts them to a proper YAML list.
 * - Does NOT add tags if missing.
 * - Does NOT change other frontmatter keys/values.
 *
 * Safety:
 * - Creates a .bak copy unless --no-backup is used.
 * - Supports --dry-run to preview changes.
 *
 * Usage:
 *   node scripts/lane1b_fix_tags_yaml.mjs
 *   node scripts/lane1b_fix_tags_yaml.mjs --root "C:\Sites-Vercel\BuildGuiders" --dry-run
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
const REPORT_PATH = getArg("--report", path.join(ROOT, "lane1b_tags_yaml_report.csv"));

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

function isYamlKeyLine(line) {
    // A conservative "top-level YAML key" detector: starts at column 0, "key:".
    return /^[A-Za-z0-9_-]+\s*:\s*(.*)$/.test(line);
}

function fixTagsBlock(frontmatter) {
    const lines = frontmatter.split("\n");
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Find `tags:` line at top-level
        if (/^tags\s*:\s*(.*)$/.test(line)) {
            const tail = line.replace(/^tags\s*:\s*/, "");

            // Case 1: inline list already present (tags: [a, b]) — leave as-is (format-only lane)
            if (tail.startsWith("[") && tail.includes("]")) {
                continue;
            }

            // If tags: already has a scalar value (tags: hdmi) -> convert to list with one item
            if (tail.trim() && !tail.trim().startsWith("-")) {
                lines[i] = "tags:";
                lines.splice(i + 1, 0, `  - ${tail.trim().replace(/^["']|["']$/g, "")}`);
                changed = true;
                i++; // move past inserted line
                continue;
            }

            // Case 2: tags: followed by list items already (indented dash) — leave
            const next = lines[i + 1] ?? "";
            if (/^\s*-\s+/.test(next)) continue;

            // Case 3: tags: followed by plain lines (often unindented) until next YAML key
            // Collect candidate tag lines until next top-level key or end
            const collected = [];
            let j = i + 1;
            while (j < lines.length) {
                const L = lines[j];

                // Stop if next top-level YAML key begins (e.g. title:, slug:)
                if (isYamlKeyLine(L) && !/^\s+/.test(L)) break;

                // Stop on blank line? (frontmatter often has no blank lines; but we’ll allow blanks and skip them)
                if (L.trim() === "") {
                    j++;
                    continue;
                }

                // If it already looks like a list item, we assume it's fine and stop converting
                if (/^\s*-\s+/.test(L)) {
                    // It might be an indented list with missing "tags:"? Rare; we leave.
                    return { fm: frontmatter, changed: false };
                }

                // Otherwise treat as a tag value line (strip bullets/quotes lightly)
                const val = L.trim()
                    .replace(/^[-*]\s+/, "")
                    .replace(/^["']|["']$/g, "");

                // Skip lines that look like accidental YAML (contain ':'), unless quoted
                if (val.includes(":")) break;

                collected.push(val);
                j++;
            }

            if (collected.length > 0) {
                // Replace the lines between i+1 and j-1 with proper list items
                const newBlock = collected.map((t) => `  - ${t}`);
                lines.splice(i + 1, j - (i + 1), ...newBlock);
                changed = true;
            }

            // Done (only first tags block expected)
            break;
        }
    }

    return { fm: lines.join("\n"), changed };
}

const files = walk(CONTENT_DIR);
let changedCount = 0;
const reportRows = [];

for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const { hasFM, fm, body } = splitFrontmatter(original);
    if (!hasFM) continue;

    const fixed = fixTagsBlock(fm);
    if (!fixed.changed) continue;

    const updated = `---\n${fixed.fm}\n---\n${body}`;
    changedCount++;

    reportRows.push({
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        change: "normalized tags block to YAML list",
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

console.log(`Lane 1B (tags YAML) scan: ${files.length} files`);
console.log(`Changed: ${changedCount} file(s)`);
console.log(DRY_RUN ? "Dry run only (no files written)." : `Report: ${REPORT_PATH}`);

process.exit(0);
