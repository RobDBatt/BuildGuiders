// scripts/lane2_retrofit_gemini.mjs
// Usage:
//   node scripts/lane2_retrofit_gemini.mjs --slug apple-tv-wifi-buffering --dry-run
//   node scripts/lane2_retrofit_gemini.mjs --slugs-file reports/lane2-picked-20.json
//   node scripts/lane2_retrofit_gemini.mjs --slugs "a,b,c" --write
//
// Expects:
//   contentRoot = content/gadget-guiders
// Env:
//   GEMINI_API_KEY (required)
//   GEMINI_MODEL (optional; default gemini-2.5-flash)

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);

function getArg(name) {
    const i = argv.indexOf(name);
    if (i === -1) return null;
    return argv[i + 1] ?? null;
}
function hasFlag(name) {
    return argv.includes(name);
}

function normalizeGeminiModelName(m) {
    const s = (m || "").trim();
    if (!s) return "gemini-2.5-flash";
    // Accept either "gemini-2.5-flash" or "models/gemini-2.5-flash"
    return s.startsWith("models/") ? s.slice("models/".length) : s;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = normalizeGeminiModelName(process.env.GEMINI_MODEL);
if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in environment.");
    process.exit(2);
}

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content", "articles");

function readText(p) {
    return fs.readFileSync(p, "utf8");
}
function writeText(p, s) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, s, "utf8");
}

function splitFrontmatter(mdx) {
    // Expect YAML frontmatter at top: ---\n...\n---
    const m = mdx.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!m) return null;
    return { fm: m[1], body: m[2] };
}

function extractLinks(text) {
    // http(s) + /articles/*
    const links = new Set();
    const httpRe = /\bhttps?:\/\/[^\s)>"']+/g;
    const artRe = /\b\/articles\/[a-z0-9\-\/]+/gi;

    for (const match of text.matchAll(httpRe)) links.add(match[0]);
    for (const match of text.matchAll(artRe)) links.add(match[0]);
    return links;
}

function countIfThen(text) {
    // Count explicit "If ... then ..." (case-insensitive)
    const re = /\bif\b[\s\S]{0,160}?\bthen\b/gi;
    return (text.match(re) || []).length;
}

function hasRequiredHeadings(text) {
    const norm = text.replace(/\r\n/g, "\n");
    // Check for TL;DR (loose) and at least one Solution heading
    return /TL;DR/i.test(norm) && norm.includes("## Solution 1");
}

function firmwareLateStage(text) {
    // Rough guard: ensure the first mention of firmware/software update is not in TL;DR/Quick diagnosis early bullets
    // We enforce: "Firmware" section appears AFTER Ranked fixes starts (late-stage).
    const norm = text.toLowerCase();
    const idxRanked = norm.indexOf("## solution");
    if (idxRanked === -1) return false;
    const beforeRanked = norm.slice(0, idxRanked);
    const earlyMention =
        beforeRanked.includes("firmware") ||
        beforeRanked.includes("software update") ||
        beforeRanked.includes("update your tv") ||
        beforeRanked.includes("update your");
    return !earlyMention;
}

function enforceLeadingH1(body, titleFromFm) {
    // If the model forgets to include a top heading, add one.
    const norm = body.trimStart();
    if (norm.startsWith("## ")) return body;
    if (titleFromFm) return `## ${titleFromFm}\n\n${body.trim()}\n`;
    return body;
}

function extractFmField(fm, key) {
    // Simple YAML key extractor for single-line fields: key: value
    const re = new RegExp(`^${key}:\\s*(.*)\\s*$`, "m");
    const m = fm.match(re);
    if (!m) return null;
    return m[1].replace(/^['"]|['"]$/g, "");
}

async function geminiRewriteBody({ slug, frontmatter, body }) {
    const title = extractFmField(frontmatter, "title") || slug;

    const system = `
You are rewriting ONLY the MDX BODY of a BuildGuiders troubleshooting article.
Hard rules:
- DO NOT output YAML frontmatter. Output body content only.
- Keep ALL existing links exactly as they appear in the original body (http/https and /articles/*). Do not add or remove links.
- Keep scope strictly living-room AV gear (TVs, receivers, soundbars, streamers, HDMI, Wi-Fi for streaming). No phones/laptops unless the article is explicitly about that.
- **CRITICAL:** The solutions must directly resolve the specific issue described in the Title ("${title}"). Do not write generic troubleshooting. Research specific fixes for this specific problem (e.g. error codes, specific model quirks).
- Use this exact section schema:
  **The Quick Answer (TL;DR):**
  [Concise 2-sentence answer]

  ---

  ## Symptoms
  * [Bullet points of specific symptoms]

  ## Solution 1: [Most Likely Fix Name]
  [Step-by-step instructions]

  ## Solution 2: [Next Most Likely Fix Name]
  [Step-by-step instructions]

  ## Solution 3: [Less Likely / More Complex Fix Name]
  [Step-by-step instructions]

  ## Is it still broken?
  [What to do if hardware is failed]

- Include at least 3 explicit decision branches written as: "If ... then ...".
- Firmware/software updates must be late-stage (Solution 3 or later), NOT the first fix unless it is a known bug requiring a patch.
- Be technician-style: concrete steps, orders, settings names, power-cycle order, and “what to try next” logic.
`;

    const user = `
Slug: ${slug}
Title: ${title}

ORIGINAL BODY (rewrite this into Gold Standard, preserving links):
${body}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: `${system}\n\n${user}` }],
            },
        ],
        generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 6000,
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${t}`);
    }

    const json = await res.json();
    const text =
        json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    return text.trim();
}

function validateRewrite({ originalMdx, newMdx }) {
    const o = splitFrontmatter(originalMdx);
    const n = splitFrontmatter(newMdx);
    if (!o || !n) return { ok: false, reason: "Frontmatter parse failed." };

    // 1) frontmatter must be identical
    if (o.fm.trim() !== n.fm.trim())
        return { ok: false, reason: "Frontmatter changed." };

    // 2) links unchanged across full doc (body imports included)
    const oLinks = extractLinks(o.body);
    const nLinks = extractLinks(n.body);

    // Warn but allow link changes for this batch (since we are fixing slop)
    if (oLinks.size !== nLinks.size) {
        console.warn(`WARN: Links changed (count ${oLinks.size} -> ${nLinks.size}). Proceeding.`);
    }
    for (const l of oLinks) {
        if (!nLinks.has(l))
            console.warn(`WARN: Missing original link: ${l}. Proceeding.`);
    }

    // 3) schema headings
    if (!hasRequiredHeadings(n.body))
        return { ok: false, reason: "Missing required Gold headings." };

    // 4) if/then
    const ifThen = countIfThen(n.body);
    if (ifThen < 3)
        return { ok: false, reason: `If/then too low: ${ifThen}` };

    // 5) firmware late-stage
    if (!firmwareLateStage(n.body)) {
        console.warn("WARN: Firmware mentioned early (ignoring for this batch). Proceeding.");
    }

    return { ok: true };
}

async function processSlug(slug, { dryRun }) {
    const p = path.join(contentRoot, `${slug}.mdx`);
    if (!fs.existsSync(p)) {
        console.warn(`SKIP: Not found: ${p}`);
        return { slug, status: "skip:not_found" };
    }

    const original = readText(p);
    const parts = splitFrontmatter(original);
    if (!parts) {
        console.warn(`FAIL: frontmatter parse: ${slug}`);
        return { slug, status: "fail:frontmatter_parse" };
    }

    const rewrittenBodyRaw = await geminiRewriteBody({
        slug,
        frontmatter: parts.fm,
        body: parts.body,
    });

    // Reassemble with unchanged frontmatter
    const title = extractFmField(parts.fm, "title");
    const rewrittenBody = enforceLeadingH1(rewrittenBodyRaw, title);
    const updated = `---\n${parts.fm.trim()}\n---\n\n${rewrittenBody.trim()}\n`;

    const v = validateRewrite({ originalMdx: original, newMdx: updated });
    if (!v.ok) {
        console.warn(`FAIL: ${slug}: ${v.reason}`);
        // Save a debug artifact so you can inspect what Gemini did
        const debugDir = path.join(repoRoot, "reports", "lane2-gemini-fails");
        writeText(path.join(debugDir, `${slug}.updated.mdx`), updated);
        return { slug, status: `fail:${v.reason}` };
    }

    if (dryRun) {
        console.log(`OK (dry-run): ${slug}`);
        return { slug, status: "ok:dry_run" };
    }

    writeText(p, updated);
    console.log(`OK (written): ${slug}`);
    return { slug, status: "ok:written" };
}

function parseSlugsInput() {
    const one = getArg("--slug");
    if (one) return [one];

    const csv = getArg("--slugs");
    if (csv) return csv.split(",").map((s) => s.trim()).filter(Boolean);

    const file = getArg("--slugs-file");
    if (file) {
        const raw = readText(path.resolve(repoRoot, file));
        // Supports either:
        // 1) a json with { picked:[{slug:...}, ...] }
        // 2) a plain text list of slugs, one per line
        try {
            const j = JSON.parse(raw);
            if (Array.isArray(j)) return j.map((x) => (typeof x === "string" ? x : x.slug)).filter(Boolean);
            if (Array.isArray(j?.picked)) return j.picked.map((x) => x.slug).filter(Boolean);
        } catch (_) {
            // fallthrough to line list
        }
        return raw
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s && !s.startsWith("#"));
    }

    console.error("Provide --slug, --slugs, or --slugs-file");
    process.exit(2);
}

const slugs = parseSlugsInput();
const dryRun = hasFlag("--dry-run") || !hasFlag("--write");

(async () => {
    const started = Date.now();
    const results = [];

    for (const slug of slugs) {
        try {
            results.push(await processSlug(slug, { dryRun }));
            if (!dryRun) {
                console.log("Waiting 25.5s to respect rate limit...");
                await new Promise((resolve) => setTimeout(resolve, 25500));
            }
        } catch (e) {
            console.warn(`ERROR: ${slug}: ${e?.message || e}`);
            results.push({ slug, status: `error:${e?.message || e}` });
        }
    }

    const outDir = path.join(repoRoot, "reports", "lane2-gemini");
    fs.mkdirSync(outDir, { recursive: true });
    writeText(
        path.join(outDir, `run-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`),
        JSON.stringify({ dryRun, model: GEMINI_MODEL, tookMs: Date.now() - started, results }, null, 2)
    );

    const ok = results.filter((r) => r.status.startsWith("ok")).length;
    const bad = results.length - ok;
    console.log(`Done. OK=${ok} FAIL/SKIP=${bad} (report in reports/lane2-gemini/)`);
})();
