#!/usr/bin/env node
/**
 * dump_prompt3.mjs
 * Usage:
 *   node scripts/dump_prompt3.mjs --slug <slug>
 *   node scripts/dump_prompt3.mjs --file <relativePathToMdx>
 *
 * Output:
 *   Prompt-3-ready block containing A) ORIGINAL (from git HEAD) + B) UPDATED (from disk)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function getArg(flag) {
    const idx = process.argv.indexOf(flag);
    if (idx === -1) return null;
    return process.argv[idx + 1] ?? null;
}

function die(msg, code = 1) {
    console.error(`\nERROR: ${msg}\n`);
    process.exit(code);
}

function gitShowHead(fileRel) {
    try {
        // Use HEAD version as "ORIGINAL"
        const out = execSync(`git show HEAD:${fileRel}`, { stdio: ["ignore", "pipe", "pipe"] });
        return out.toString("utf8");
    } catch (e) {
        const stderr = e?.stderr?.toString?.("utf8") ?? "";
        die(`Could not read ORIGINAL from git HEAD for "${fileRel}".\n${stderr}`.trim());
    }
}

function resolveFileRelFromSlug(slug) {
    // BuildGuiders retrofit path requirement:
    const candidate = path.posix.join("content", "gadget-guiders", `${slug}.mdx`);
    return candidate;
}

const slug = getArg("--slug");
const fileArg = getArg("--file");

if (!slug && !fileArg) {
    die(`Missing args.
Examples:
  node scripts/dump_prompt3.mjs --slug lg-c3-soundbar-earc-no-sound-cutouts-fixes
  node scripts/dump_prompt3.mjs --file content/gadget-guiders/lg-c3-soundbar-earc-no-sound-cutouts-fixes.mdx`);
}

if (slug && fileArg) {
    die(`Use either --slug OR --file (not both).`);
}

const fileRel = fileArg
    ? fileArg.replace(/\\/g, "/")
    : resolveFileRelFromSlug(slug);

const fileAbs = path.resolve(process.cwd(), fileRel);

if (!fs.existsSync(fileAbs)) {
    die(`UPDATED file not found on disk: ${fileAbs}`);
}

const updated = fs.readFileSync(fileAbs, "utf8");
const original = gitShowHead(fileRel);

const prompt = `You are validating a retrofitted BuildGuiders MDX article against strict rules.

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

process.stdout.write(prompt);
