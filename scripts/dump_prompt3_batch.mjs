#!/usr/bin/env node
/**
 * dump_prompt3_batch.mjs
 * Reads a JSON file that contains { picked: [{ slug, mdxPath, ... }, ...] }
 * Writes Prompt-3 blocks to reports/prompt3/<slug>.txt
 *
 * Usage:
 *   node scripts/dump_prompt3_batch.mjs --picked reports/lane2-picked.json
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function arg(flag) {
    const i = process.argv.indexOf(flag);
    return i === -1 ? null : (process.argv[i + 1] ?? null);
}

function die(msg) {
    console.error(`\nERROR: ${msg}\n`);
    process.exit(1);
}

const pickedFile = arg("--picked");
if (!pickedFile) die("Missing --picked <file.json>");

const pickedAbs = path.resolve(process.cwd(), pickedFile);
if (!fs.existsSync(pickedAbs)) die(`Picked JSON not found: ${pickedAbs}`);

const raw = fs.readFileSync(pickedAbs, "utf8");
let data;
try { data = JSON.parse(raw); } catch { die("Picked JSON is not valid JSON."); }

const picked = data?.picked;
if (!Array.isArray(picked) || picked.length === 0) die("Picked JSON has no .picked[] array.");

const outDir = path.resolve(process.cwd(), "reports", "prompt3");
fs.mkdirSync(outDir, { recursive: true });

function gitShowHead(fileRel) {
    const rel = fileRel.replace(/\\/g, "/");
    try {
        return execSync(`git show HEAD:${rel}`, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
    } catch (e) {
        const stderr = e?.stderr?.toString?.("utf8") ?? "";
        die(`git show failed for ${rel}\n${stderr}`.trim());
    }
}

function promptWrap(original, updated) {
    return `You are validating a retrofitted BuildGuiders MDX article against strict rules.

You will be given:
A) ORIGINAL MDX
B) UPDATED MDX

Return a strict PASS/FAIL report for:
1) Slug unchanged
2) Frontmatter unchanged (keys + values)
3) Links unchanged (all http(s) + /articles/*)
4) Required headings present (Gold Standard schema)
5) >=3 explicit “If ... then ...” branches
6) Firmware/software updates appear late-stage (not step 1–3)
7) Scope remains living-room AV gear

A) ORIGINAL MDX:
${original.trimEnd()}

B) UPDATED MDX:
${updated.trimEnd()}
`;
}

let wrote = 0;

for (const item of picked) {
    const slug = item?.slug;
    const mdxPathWin = item?.mdxPath;

    if (!slug) continue;

    // Prefer provided mdxPath; otherwise fallback to standard location.
    const fileRel = mdxPathWin
        ? path.relative(process.cwd(), mdxPathWin)
        : path.join("content", "gadget-guiders", `${slug}.mdx`);

    const fileAbs = path.resolve(process.cwd(), fileRel);

    if (!fs.existsSync(fileAbs)) {
        console.warn(`Skipping (missing UPDATED): ${slug} -> ${fileAbs}`);
        continue;
    }

    const updated = fs.readFileSync(fileAbs, "utf8");
    const original = gitShowHead(fileRel);

    const out = path.join(outDir, `${slug}.txt`);
    fs.writeFileSync(out, promptWrap(original, updated), "utf8");
    wrote++;
}

console.log(`Wrote ${wrote} Prompt-3 files to: ${outDir}`);
