import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const TARGETS_PATH = path.join(REPO_ROOT, "reports", "lane2_targets_20.json");
const LATEST_PTR = path.join(REPO_ROOT, ".retrofit-snapshots", "LATEST.txt");
const PROMPTS_DIR = path.join(REPO_ROOT, "prompts", "lane2");

function readLatestOriginal(slug) {
    if (!fs.existsSync(LATEST_PTR)) {
        throw new Error(`Missing ${LATEST_PTR}. Run freeze step first.`);
    }
    const snapRoot = fs.readFileSync(LATEST_PTR, "utf8").trim();
    const origPath = path.join(snapRoot, "originals", `${slug}.mdx`);
    if (!fs.existsSync(origPath)) {
        throw new Error(`Missing original snapshot: ${origPath}`);
    }
    return fs.readFileSync(origPath, "utf8");
}

function main() {
    if (!fs.existsSync(TARGETS_PATH)) {
        console.error(`Targets file not found: ${TARGETS_PATH}`);
        process.exit(1);
    }

    const parsed = JSON.parse(fs.readFileSync(TARGETS_PATH, "utf8"));
    const picked = Array.isArray(parsed?.picked) ? parsed.picked : [];
    if (!picked.length) {
        console.error(`No picked targets found in ${TARGETS_PATH}`);
        process.exit(1);
    }

    fs.mkdirSync(PROMPTS_DIR, { recursive: true });

    for (const item of picked) {
        const slug = item.slug;
        if (!slug) continue;

        const originalMdx = readLatestOriginal(slug);

        const retrofitPrompt = `You are retrofitting ONE existing BuildGuiders MDX article.

HARD RULES (do not violate):
- Do NOT change the slug in frontmatter.
- Do NOT add/remove/modify ANY links (http(s) or /articles/*). Keep them EXACTLY the same.
- Do NOT add new affiliate links. Preserve any existing paid links exactly as-is.
- Do NOT change the frontmatter keys/values (treat frontmatter as read-only).
- Keep scope to living-room AV gear only.

GOAL:
Rewrite ONLY the BODY content into the “Gold Standard” structure:

Required sections (must exist exactly as H2):
## TL;DR
## Quick diagnosis
## When this usually happens
## Ranked fixes (fastest first)
## What usually does NOT help
## If it still doesn’t work
## Last resort / hardware limitation

Inside “Ranked fixes”, include at least 3 explicit decision branches using phrasing like:
- If <symptom/condition>, then <action>.
- If <result>, then <next step>.

Also:
- Keep firmware/software updates as a late-stage step (not in steps 1–3).
- Be concrete (settings menu paths, order of power-cycling, what to test next).
- Keep it human and technician-style, not generic.

INPUT (ORIGINAL MDX — frontmatter + body):
---
${originalMdx}
`;

        const validatePrompt = `You are validating a retrofitted BuildGuiders MDX article against strict rules.

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
---
${originalMdx}

B) UPDATED MDX:
---
(PASTE UPDATED MDX HERE)
`;

        fs.writeFileSync(
            path.join(PROMPTS_DIR, `${slug}.retrofit.prompt.txt`),
            retrofitPrompt,
            "utf8"
        );
        fs.writeFileSync(
            path.join(PROMPTS_DIR, `${slug}.validate.prompt.txt`),
            validatePrompt,
            "utf8"
        );
    }

    console.log(`Wrote prompts for ${picked.length} targets to: ${PROMPTS_DIR}`);
}

main();
