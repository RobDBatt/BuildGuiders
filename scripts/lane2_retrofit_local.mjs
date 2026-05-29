// scripts/lane2_retrofit_local.mjs
// Local-only retrofit (no API).
//
// Usage:
//   node scripts/lane2_retrofit_local.mjs --slug lg-c3-soundbar-earc-no-sound-cutouts-fixes --write
//   node scripts/lane2_retrofit_local.mjs --slugs-file reports/lane2_targets_20.json --write
//   node scripts/lane2_retrofit_local.mjs --slugs-file reports/lane2_targets_20.json --dry-run
//
// Rules enforced:
// - Frontmatter unchanged (byte-for-byte)
// - No new links; preserve all existing http(s) + /articles/* links
// - Gold headings present
// - >=3 explicit "If ... then ..." branches
// - Firmware/software updates only late-stage (not TL;DR / first fixes)

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

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content", "gadget-guiders");

function readText(p) {
    return fs.readFileSync(p, "utf8");
}
function writeText(p, s) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, s, "utf8");
}

function splitFrontmatter(mdx) {
    const m = mdx.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!m) return null;
    return { fmRaw: m[1], bodyRaw: m[2] };
}

function extractFmField(fmRaw, key) {
    const re = new RegExp(`^${key}:\\s*(.*)\\s*$`, "m");
    const m = fmRaw.match(re);
    if (!m) return null;
    return m[1].replace(/^['"]|['"]$/g, "");
}

function extractLinks(text) {
    const links = new Set();
    const httpRe = /\bhttps?:\/\/[^\s)>"']+/g;
    const artRe = /\b\/articles\/[a-z0-9\-\/]+/gi;
    for (const match of text.matchAll(httpRe)) links.add(match[0]);
    for (const match of text.matchAll(artRe)) links.add(match[0]);
    return links;
}

function countIfThen(text) {
    const re = /\bif\b[\s\S]{0,180}?\bthen\b/gi;
    return (text.match(re) || []).length;
}

function normalizeNewlines(s) {
    return s.replace(/\r\n/g, "\n");
}

function stripFirmwareMentionsEarly(body) {
    // Remove lines/bullets mentioning firmware/software updates from early content.
    // We'll reintroduce them later-stage (in "If it still doesn’t work").
    const lines = normalizeNewlines(body).split("\n");
    const removed = [];
    const kept = [];
    const fwRe = /(firmware|software update|update your tv|update your soundbar|update your receiver|system update)/i;

    for (const line of lines) {
        if (fwRe.test(line)) {
            removed.push(line);
            continue;
        }
        kept.push(line);
    }

    return { kept: kept.join("\n"), removed };
}

function pickIntentHints(slug, title) {
    const s = `${slug} ${title}`.toLowerCase();

    const isWifi = /(wifi|wi-fi|buffer|buffering|network|timeout|mesh)/.test(s);
    const isHdmiArc = /(hdmi|arc|earc|handshake|hdcp|no sound|audio drop|cutout|cutouts)/.test(s);

    return { isWifi, isHdmiArc };
}

function buildIfThenBranches({ isWifi, isHdmiArc }) {
    // Always produce 3+ explicit If...then... lines.
    const branches = [];

    if (isHdmiArc) {
        branches.push(
            "If the TV shows “TV Speakers” after you select eARC/ARC, then HDMI-CEC (Simplink/Bravia Sync/Anynet+) is not handshaking and you should power-cycle and re-enable CEC + eARC."
        );
        branches.push(
            "If you only lose sound on one app (Netflix works but Disney+ is silent), then the issue is likely app audio/output format and you should toggle the TV’s Digital Sound Output (Auto/Pass Through/PCM) and retest."
        );
    }

    if (isWifi) {
        branches.push(
            "If buffering only happens during peak hours, then the bottleneck is usually Wi-Fi congestion and you should move the streamer to 5 GHz (or wired Ethernet) and rerun the same scene."
        );
    }

    // Ensure at least 3
    branches.push(
        "If audio cuts out only when you switch inputs, then the HDMI chain is renegotiating and you should simplify to TV ↔ soundbar/receiver only and add devices back one at a time."
    );

    return branches.slice(0, 4);
}

function buildRankedFixes({ isWifi, isHdmiArc }) {
    // Keep these generic and living-room AV scoped.
    const fixes = [];

    if (isHdmiArc) {
        fixes.push(
            [
                "**Fix 1 — Confirm the correct HDMI ports**",
                "- TV: use the HDMI port labeled **ARC/eARC** (usually only one).",
                "- Soundbar/receiver: use the port labeled **TV ARC/eARC**.",
            ].join("\n")
        );
        fixes.push(
            [
                "**Fix 2 — Hard power-cycle the chain (handshake reset)**",
                "1. Turn off TV + soundbar/receiver.",
                "2. Unplug both from power for 60 seconds.",
                "3. Disconnect the HDMI cable during the unplug.",
                "4. Reconnect HDMI, then power on **TV first**, then soundbar/receiver.",
            ].join("\n")
        );
        fixes.push(
            [
                "**Fix 3 — Lock the TV audio output to a compatible mode**",
                "- Set Digital Sound Output to **Auto** (or **Pass Through** if stable).",
                "- If silence persists, temporarily force **Dolby Digital** (avoid multichannel PCM for testing).",
            ].join("\n")
        );
    }

    if (isWifi) {
        fixes.push(
            [
                "**Fix 1 — Prove whether it’s Wi-Fi or the app**",
                "- Test the same content on two apps (YouTube + Netflix).",
                "- If only one app buffers, clear that app cache / reinstall it.",
            ].join("\n")
        );
        fixes.push(
            [
                "**Fix 2 — Reduce Wi-Fi interference fast**",
                "- Move the streamer closer or switch to **5 GHz**.",
                "- If available, test **Ethernet** to eliminate Wi-Fi entirely.",
            ].join("\n")
        );
        fixes.push(
            [
                "**Fix 3 — Stabilize DNS + router behavior (safe toggles)**",
                "- Reboot modem/router.",
                "- Disable “Smart Connect” temporarily and pin streamer to one band.",
            ].join("\n")
        );
    }

    // Always include at least 3 items in Ranked fixes
    while (fixes.length < 3) {
        fixes.push(
            [
                "**Fix — Simplify the setup**",
                "- Disconnect extra HDMI devices and test with only TV ↔ soundbar/receiver/streamer.",
                "- Add devices back one at a time to find the trigger.",
            ].join("\n")
        );
    }

    return fixes.slice(0, 6);
}

function buildGoldBody({ slug, title, originalBody }) {
    const { kept, removed } = stripFirmwareMentionsEarly(originalBody);
    const { isWifi, isHdmiArc } = pickIntentHints(slug, title);

    const links = Array.from(extractLinks(originalBody)); // preserve by NOT adding new ones
    void links; // (kept for clarity; we don't print them separately)

    const ifThen = buildIfThenBranches({ isWifi, isHdmiArc });
    const fixes = buildRankedFixes({ isWifi, isHdmiArc });

    const fwLateStageBlock = [
        "### Late-stage: firmware / software updates (do this only after the fixes above)",
        "- Check for TV firmware updates and soundbar/receiver firmware updates.",
        "- After updating, repeat the handshake/power-cycle steps (updates can reset HDMI-CEC/eARC behavior).",
    ].join("\n");

    // Reintroduce any removed firmware lines here (late-stage)
    const removedFw = removed.length
        ? ["", "#### Notes found in the original that mention updates", ...removed.map((l) => `- ${l.trim()}`)].join("\n")
        : "";

    return [
        `## TL;DR`,
        `- Follow the Ranked fixes in order. Don’t jump to firmware updates first.`,
        `- Use the If/then branches to pick the next step based on what you see.`,
        ``,
        `## Quick diagnosis`,
        ...ifThen.map((b) => `- ${b}`),
        ``,
        `## When this usually happens`,
        `- After changing HDMI cables/ports, toggling TV audio settings, or after an app/device power event.`,
        `- After adding/removing an HDMI device (console, streamer) that changes HDMI negotiation.`,
        `- After router changes (for buffering/network articles).`,
        ``,
        `## Ranked fixes (fastest first)`,
        fixes.map((x) => `- ${x}`).join("\n\n"),
        ``,
        `## What usually does NOT help`,
        `- Randomly flipping many settings at once (you can’t tell what fixed it).`,
        `- Replacing hardware before you isolate the HDMI chain / Wi-Fi path.`,
        ``,
        `## If it still doesn’t work`,
        `- Re-test with the simplest chain (TV ↔ soundbar/receiver only, or TV ↔ streamer only).`,
        `- Document exactly what changes the behavior (which app, which HDMI input, which audio format).`,
        ``,
        fwLateStageBlock + removedFw,
        ``,
        `## Last resort / hardware limitation`,
        `- If eARC/ARC remains unstable across known-good cables and a minimal chain, it may be a device interoperability issue or a failing HDMI board.`,
        `- At that point, test an alternate path (optical, different streamer, or different HDMI port if supported) to confirm the limitation.`,
        ``,
        `---`,
        `### Notes (original body preserved for reference)`,
        kept.trim(),
        ``,
    ].join("\n");
}

function parseSlugsInput() {
    const one = getArg("--slug");
    if (one) return [one];

    const csv = getArg("--slugs");
    if (csv) return csv.split(",").map((s) => s.trim()).filter(Boolean);

    const file = getArg("--slugs-file");
    if (file) {
        const raw = readText(path.resolve(repoRoot, file));
        try {
            const j = JSON.parse(raw);
            if (Array.isArray(j)) return j.map((x) => (typeof x === "string" ? x : x.slug)).filter(Boolean);
            if (Array.isArray(j?.picked)) return j.picked.map((x) => x.slug).filter(Boolean);
        } catch (_) { }
        return raw
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s && !s.startsWith("#"));
    }

    console.error("Provide --slug, --slugs, or --slugs-file");
    process.exit(2);
}

function validateLocalContract({ originalMdx, updatedMdx }) {
    const o = splitFrontmatter(originalMdx);
    const n = splitFrontmatter(updatedMdx);
    if (!o || !n) return { ok: false, reason: "Frontmatter parse failed." };

    // Frontmatter unchanged (byte-for-byte)
    if (o.fmRaw !== n.fmRaw) return { ok: false, reason: "Frontmatter changed." };

    // Links unchanged (set equality)
    const oLinks = extractLinks(o.bodyRaw);
    const nLinks = extractLinks(n.bodyRaw);
    if (oLinks.size !== nLinks.size) return { ok: false, reason: `Links changed (count ${oLinks.size} -> ${nLinks.size}).` };
    for (const l of oLinks) if (!nLinks.has(l)) return { ok: false, reason: `Missing original link: ${l}` };

    // Required headings
    const required = [
        "## TL;DR",
        "## Quick diagnosis",
        "## When this usually happens",
        "## Ranked fixes (fastest first)",
        "## What usually does NOT help",
        "## If it still doesn’t work",
        "## Last resort / hardware limitation",
    ];
    const norm = normalizeNewlines(n.bodyRaw);
    for (const h of required) if (!norm.includes(h)) return { ok: false, reason: `Missing required heading: ${h}` };

    // If/then >= 3
    const ifThen = countIfThen(n.bodyRaw);
    if (ifThen < 3) return { ok: false, reason: `If/then too low: ${ifThen}` };

    // Firmware late-stage (not before Ranked fixes)
    const lower = norm.toLowerCase();
    const idxRanked = lower.indexOf("## ranked fixes");
    if (idxRanked === -1) return { ok: false, reason: "Missing ranked fixes heading." };
    const beforeRanked = lower.slice(0, idxRanked);
    const earlyFw =
        beforeRanked.includes("firmware") ||
        beforeRanked.includes("software update") ||
        beforeRanked.includes("system update") ||
        beforeRanked.includes("update your tv") ||
        beforeRanked.includes("update your");
    if (earlyFw) return { ok: false, reason: "Firmware/software mention appears too early." };

    return { ok: true };
}

async function processSlug(slug, { write }) {
    const p = path.join(contentRoot, `${slug}.mdx`);
    if (!fs.existsSync(p)) return { slug, status: "skip:not_found" };

    const original = readText(p);
    const parts = splitFrontmatter(original);
    if (!parts) return { slug, status: "fail:frontmatter_parse" };

    const title = extractFmField(parts.fmRaw, "title") || slug;

    const newBody = buildGoldBody({ slug, title, originalBody: parts.bodyRaw });
    const updated = `---\n${parts.fmRaw}\n---\n${newBody.trim()}\n`;

    const v = validateLocalContract({ originalMdx: original, updatedMdx: updated });
    if (!v.ok) {
        const debugDir = path.join(repoRoot, "reports", "lane2-local-fails");
        writeText(path.join(debugDir, `${slug}.updated.mdx`), updated);
        return { slug, status: `fail:${v.reason}` };
    }

    if (write) {
        writeText(p, updated);
        return { slug, status: "ok:written" };
    }
    return { slug, status: "ok:dry_run" };
}

(async () => {
    const slugs = parseSlugsInput();
    const write = hasFlag("--write");
    const started = Date.now();

    const results = [];
    for (const slug of slugs) {
        try {
            results.push(await processSlug(slug, { write }));
        } catch (e) {
            results.push({ slug, status: `error:${e?.message || e}` });
        }
    }

    const outDir = path.join(repoRoot, "reports", "lane2-local");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `run-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
    writeText(outPath, JSON.stringify({ write, tookMs: Date.now() - started, results }, null, 2));

    const ok = results.filter((r) => r.status.startsWith("ok")).length;
    const bad = results.length - ok;
    console.log(`Done. OK=${ok} FAIL/SKIP=${bad}`);
    console.log(`Report: ${outPath}`);
})();
