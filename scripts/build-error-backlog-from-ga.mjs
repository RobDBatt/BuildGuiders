import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, "..", "data", "ga-search-queries.csv");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "error-backlog.json");

const BRAND_KEYWORDS = [
  "lg",
  "samsung",
  "sony",
  "tcl",
  "vizio",
  "hisense",
  "apple",
  "nvidia",
  "xbox",
  "denon",
  "yamaha",
  "onkyo",
];

const QUERY_FIELDS = ["query", "search_term"];
const VOLUME_FIELDS = ["clicks", "sessions", "event_count"];

async function readCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const row = {};
    header.forEach((key, idx) => {
      row[key] = cells[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function findField(headerFields, candidates) {
  const lowerHeader = headerFields.map((h) => h.toLowerCase());
  return candidates.find((c) => lowerHeader.includes(c.toLowerCase()));
}

function detectBrand(queryLower) {
  if (queryLower.includes("apple tv")) return "apple";
  for (const brand of BRAND_KEYWORDS) {
    if (queryLower.includes(brand)) return brand;
  }
  return null;
}

function detectDevice(queryLower, brand) {
  if (queryLower.includes("tv") || queryLower.includes("oled") || queryLower.includes("qled")) {
    return "tv";
  }
  if (queryLower.includes("receiver") || queryLower.includes("avr")) {
    return "receiver";
  }
  if (queryLower.includes("soundbar") || queryLower.includes("sound bar")) {
    return "soundbar";
  }
  if (
    queryLower.includes("apple tv") ||
    queryLower.includes("fire stick") ||
    queryLower.includes("roku") ||
    queryLower.includes("nvidia shield") ||
    queryLower.includes("streaming") ||
    queryLower.includes("android tv")
  ) {
    return "streaming-device";
  }

  const tvBrands = ["lg", "samsung", "sony", "tcl", "vizio", "hisense"];
  if (brand && tvBrands.includes(brand)) return "tv";

  return null;
}

function extractErrorCode(queryLower) {
  const patterns = [
    /0x[0-9a-f]+/i,
    /\b[ef]\d{2,4}\b/i,
    /\berror\s*([0-9a-z]+)/i,
    /\bcode\s*([0-9a-z]+)/i,
    /\b([a-z]\d{2,4})\b/i,
  ];

  for (const regex of patterns) {
    const match = queryLower.match(regex);
    if (match) {
      if (match[1]) return match[1];
      return match[0];
    }
  }
  return null;
}

function looksLikeErrorQuery(queryLower) {
  return (
    queryLower.includes("error") ||
    queryLower.includes("code") ||
    queryLower.includes("error code") ||
    queryLower.includes("error number") ||
    /0x[0-9a-f]+/i.test(queryLower) ||
    /\b[a-z]\d{2,4}\b/i.test(queryLower)
  );
}

async function buildBacklog() {
  try {
    await fs.access(INPUT_PATH);
  } catch {
    console.error(
      "Input CSV not found at data/ga-search-queries.csv. Please export GA queries first.",
    );
    return;
  }

  const rows = await readCsv(INPUT_PATH);
  if (rows.length === 0) {
    console.log("Input CSV is empty. Nothing to process.");
    return;
  }

  const header = Object.keys(rows[0] || {}).map((h) => h.toLowerCase());
  const queryField = findField(header, QUERY_FIELDS);
  const volumeField = findField(header, VOLUME_FIELDS);

  if (!queryField) {
    console.error("No query/search_term column found in CSV header.");
    return;
  }

  const aggregate = new Map();

  for (const row of rows) {
    const queryRaw = row[queryField] || "";
    const queryLower = String(queryRaw).toLowerCase();
    if (!queryLower) continue;

    const brand = detectBrand(queryLower);
    if (!brand) continue;

    const device = detectDevice(queryLower, brand);
    if (!device) continue;

    if (!looksLikeErrorQuery(queryLower)) continue;

    const errorCode = extractErrorCode(queryLower);
    if (!errorCode) continue;

    let volume = 1;
    if (volumeField && row[volumeField] !== undefined) {
      const parsed = Number(row[volumeField]);
      volume = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    }

    const key = `${brand}::${device}::${errorCode}`;
    const existing = aggregate.get(key);
    if (!existing) {
      aggregate.set(key, {
        brand,
        device,
        errorCode,
        totalVolume: volume,
        exampleQuery: queryRaw,
      });
    } else {
      existing.totalVolume += volume;
      if (volume > existing.exampleVolume) {
        existing.exampleQuery = queryRaw;
        existing.exampleVolume = volume;
      }
    }
  }

  const backlog = Array.from(aggregate.values())
    .map((entry) => ({
      brand: entry.brand,
      device: entry.device,
      errorCode: entry.errorCode,
      totalVolume: entry.totalVolume,
      exampleQuery: entry.exampleQuery,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 100);

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(backlog, null, 2), "utf8");

  console.log(`Error backlog built from ${path.relative(process.cwd(), INPUT_PATH)}`);
  console.log("Top 5:");
  backlog.slice(0, 5).forEach((item) => {
    console.log(
      `  [${item.brand} / ${item.device} / ${item.errorCode}] volume=${item.totalVolume} example="${item.exampleQuery}"`,
    );
  });
}

buildBacklog().catch((err) => {
  console.error("Unhandled error building backlog:", err);
  process.exit(1);
});
