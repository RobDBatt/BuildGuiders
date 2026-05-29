import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const CONTENT_DIR = path.join(REPO_ROOT, "content", "gadget-guiders");

// Hardcoded CSV path
const CSV_PATH = "C:\\Sites-Vercel\\BuildGuiders\\article-affiliate-map.csv";

const OUT_DIR = path.join(REPO_ROOT, "reports");
const OUT_PATH = path.join(OUT_DIR, "lane2_targets_20.json");

const BATCH_SIZE = 20;

const PAIN_KEYWORDS = [
    "earc", "arc", "atmos", "lip sync", "lipsync", "audio", "buffer", "buffering", "timeout",
    "no signal", "handshake", "hdcp", "receiver", "soundbar", "wifi", "wi-fi", "network",
    "playback", "error", "stutter", "blurry", "lag", "sync", "drops", "dropouts", "cut out", "cuts out"
];

// Minimal CSV parser (handles quotes + commas-in-quotes)
function parseCSVLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        const next = line[i + 1];

        if (ch === '"' && inQuotes && next === '"') { // escaped quote
            cur += '"';
            i++;
            continue;
        }
        if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (ch === "," && !inQuotes) {
            out.push(cur);
            cur = "";
            continue;
        }
        cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
}

function scoreRow(r) {
    const title = (r.title || "").toLowerCase();
    const reason = (r.reason || "").toLowerCase();
    const intent = (r.intent || "").toLowerCase();
    const confidence = (r.confidence || "").toLowerCase();

    let score = 0;
    if (confidence === "high") score += 100;
    else if (confidence === "med" || confidence === "medium") score += 60;
    else if (confidence === "low") score += 20;

    const hay = `${title} ${reason} ${intent}`;
    let hits = 0;
    for (const k of PAIN_KEYWORDS) if (hay.includes(k)) hits++;
    score += hits * 12;

    // Nudge toward high-pain intents
    if (["hdmi", "audio", "network", "power", "remote", "streaming"].includes(intent)) score += 25;

    // Bonus if reason mentions “drops”, “no sound”, etc.
    if (/no sound|drop|cut out|lip sync|buffer|no signal|handshake/i.test(hay)) score += 20;

    return score;
}

function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV not found: ${CSV_PATH}`);
        process.exit(1);
    }
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`Content dir not found: ${CONTENT_DIR}`);
        process.exit(1);
    }

    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length < 2) {
        console.error("CSV has no data rows.");
        process.exit(1);
    }

    const header = parseCSVLine(lines[0]);
    const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

    const required = ["slug", "title", "intent", "product_key", "confidence", "reason"];
    for (const c of required) {
        if (!(c in idx)) {
            console.error(`CSV missing required column: ${c}`);
            console.error(`Found columns: ${header.join(", ")}`);
            process.exit(1);
        }
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const slug = (cols[idx.slug] || "").trim();
        if (!slug) continue;

        const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
        if (!fs.existsSync(mdxPath)) continue;

        rows.push({
            slug,
            title: cols[idx.title] ?? "",
            intent: cols[idx.intent] ?? "",
            product_key: cols[idx.product_key] ?? "",
            confidence: cols[idx.confidence] ?? "",
            reason: cols[idx.reason] ?? "",
            mdxPath
        });
    }

    const picked = rows
        .map(r => ({ ...r, score: scoreRow(r) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, BATCH_SIZE);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify({ batchSize: BATCH_SIZE, picked }, null, 2), "utf8");

    console.log(`Picked ${picked.length} targets from ${rows.length} eligible rows.`);
    console.log(`Wrote: ${OUT_PATH}`);
    picked.forEach((p, i) => console.log(`${String(i + 1).padStart(2, "0")}. ${p.slug} (${p.confidence}) score=${p.score}`));
}

main();
