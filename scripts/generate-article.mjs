import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import matter from "gray-matter";
import { validateArticleMeta } from "../lib/articleValidation.js";
import { searchItems } from "./affiliate/paapi.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- helpers ----------
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const today = () => new Date().toISOString().slice(0, 10);

const truncate = (s, max = 155) => (s.length > max ? `${s.slice(0, max - 1).trim()}…` : s);

const partnerTag = process.env.PAAPI_PARTNER_TAG || "buildguiders-20";

const fallbackProduct = {
  asin: "B0BYP2F7WT",
  name: "Certified Ultra High Speed HDMI Cable",
  description: "Certified HDMI 2.1 cable to stabilize HDMI/eARC links for common A/V fixes.",
};

const affiliateNote = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

const canonicalAffiliateUrl = (asin) => `https://www.amazon.com/dp/${asin}/?tag=${partnerTag}`;

function buildKeywords(topic) {
  const base = `${topic} fixes troubleshooting setup guide`.toLowerCase();
  const tokens = Array.from(
    new Set(
      base
        .split(/[^a-z0-9+]+/i)
        .filter((t) => t && t.length > 2)
        .slice(0, 12),
    ),
  );
  return tokens.join(", ");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function pickAffiliateProduct(topic) {
  const topicLower = (topic || "").toLowerCase();

  const classifyIntent = (t) => {
    const has = (words) => words.some((w) => t.includes(w));
    if (has(["earc", "arc", "hdmi", "hdcp", "no signal", "black screen", "input"])) {
      return {
        intent: "hdmi",
        query: "certified ultra high speed hdmi cable",
        include: ["hdmi"],
        exclude: ["mount", "bracket", "case", "cover", "adapter kit", "splitter"],
      };
    }
    if (has(["wifi", "buffer", "network", "timeout", "error 014", "error 016", "connection"])) {
      return {
        intent: "network",
        query: "ethernet cable",
        include: ["ethernet", "cat"],
        exclude: ["switch", "router", "modem", "mount", "case"],
      };
    }
    if (has(["lip sync", "audio delay", "no sound", "atmos drops", "soundbar"])) {
      return {
        intent: "audio",
        query: "optical toslink cable",
        include: ["toslink", "optical"],
        exclude: ["mount", "bracket", "case", "cover"],
      };
    }
    if (has(["remote", "pair", "batteries", "battery"])) {
      return {
        intent: "remote",
        query: "AAA batteries",
        include: ["aaa", "battery"],
        exclude: ["charger", "case"],
      };
    }
    return {
      intent: "general",
      query: "certified ultra high speed hdmi cable",
      include: ["hdmi"],
      exclude: ["mount", "bracket", "case", "cover"],
    };
  };

  const intent = classifyIntent(topicLower);

  try {
    const candidates = await searchItems({ keywords: intent.query, itemCount: 10 });
    const choice = candidates.find((c) => {
      const asin = c?.asin?.toUpperCase();
      if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) return false;
      const title = c?.title?.trim();
      if (!title) return false;
      const tl = title.toLowerCase();
      const includes = intent.include.some((w) => tl.includes(w));
      const excludes = intent.exclude.some((w) => tl.includes(w));
      return includes && !excludes;
    });

    if (choice) {
      const asin = choice.asin.toUpperCase();
      const name = choice.title.trim();
      const url = canonicalAffiliateUrl(asin);

      const descMap = {
        hdmi: "Certified HDMI cable that can help stabilize HDMI/eARC handshakes during troubleshooting.",
        network: "Ethernet cable for a stable wired connection when Wi-Fi is unreliable during streaming.",
        audio: "Optical/TOSLINK cable option for TVs/soundbars when HDMI ARC/eARC audio is unstable.",
        remote: "Fresh batteries to resolve common remote pairing and responsiveness issues.",
        general: "Helpful accessory that can resolve common setup and connectivity issues.",
      };

      return {
        name,
        asin,
        url,
        description: descMap[intent.intent] || descMap.general,
        note: affiliateNote,
      };
    }
  } catch (err) {
    console.warn(`[paapi] fallback -> using HDMI cable (${err?.message || err})`);
  }

  console.warn("[paapi] fallback -> using HDMI cable (no matching candidates)");
  const asin = fallbackProduct.asin;
  return {
    name: fallbackProduct.name,
    asin,
    url: canonicalAffiliateUrl(asin),
    description: fallbackProduct.description,
    note: affiliateNote,
  };
}

async function promptTopic() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ans = (
    await rl.question(
      'Topic (e.g., "LG C3/C4 judder vs stutter settings"): ',
    )
  ).trim();
  rl.close();
  return ans;
}

// ---------- inputs ----------
const argv = process.argv.slice(2);
let topic = argv.join(" ").trim();
if (!topic) {
  topic = await promptTopic();
  if (!topic) {
    console.error("No topic provided.");
    process.exit(1);
  }
}

const slug = slugify(topic);
const outDir = path.join(process.cwd(), "content", "articles");
const outFile = path.join(outDir, `${slug}.mdx`);
ensureDir(outDir);

// cover path the site expects (you'll place this file later)
const coverRel = `/images/covers/${slug}.jpg`;
const coverAlt = `${topic} setup or device`;

// Pick affiliate product (PA-API backed with HDMI cable fallback)
const affiliate = await pickAffiliateProduct(topic);

// ---------- prompts ----------
const system = `You write practical, accurate, step-by-step tech fix guides for home A/V and consumer tech.
- Audience: everyday users wanting clear troubleshooting.
- Style: concise steps, bulleted lists, short "why" notes.
- Compliance: no prices, no ratings, no hype, no raw HTML/JSX.
- Always include exactly one in-body affiliate link labeled with "(paid link)".
`;

const user = `
Write a complete MDX article body (no frontmatter) on: "${topic}"

Requirements:
- Start with a single H1 exactly matching the title.
- Include sections in this order with H2s: Quick answer; Symptoms; Quick checks; Step-by-step fix; If it still doesn’t work; FAQ; Related fixes.
- Add 3–4 bullets under Quick answer that are immediately actionable.
- Include 3–5 FAQ Q&As with real queries (who/what/why/how) tied to the issue.
- Add 1–3 internal links in Related fixes (use /articles/... paths already in the site where reasonable).
- Insert exactly one contextual affiliate link using this syntax: [${affiliate.name} (paid link)](${affiliate.url}) placed where it helps most. Do not add other affiliate links.
- Keep tone calm and direct; avoid filler.

Constraints:
- No prices, ratings, or time-sensitive claims.
- No frontmatter in the output.
- Keep to everyday-user language; don’t invent exact menu labels if unsure—offer plausible options instead.
`;

// ---------- call OpenAI ----------
console.log("Drafting with OpenAI.");
const resp = await client.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0.4,
  messages: [
    { role: "system", content: system },
    { role: "user", content: user },
  ],
});

let md = resp.choices?.[0]?.message?.content?.trim();
if (!md) {
  console.error("OpenAI returned no content.");
  process.exit(1);
}

// Remove surrounding triple-fence if present
if (/^```/m.test(md)) {
  md = md.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
}

// ---------- front-matter wrapper ----------
const esc = (s) => s.replace(/"/g, '\\"');
const description = truncate(
  `Practical fixes for ${topic}: clear steps, quick checks, and settings that stabilize the setup without fluff.`,
);
const keywords = buildKeywords(topic);

const frontMatter = `---
title: "${esc(topic)}"
slug: "${slug}"
date: "${today()}"
brand: ""
category: ""
coverImage: "${coverRel}"    # put file at: public${coverRel}
coverAlt: "${esc(coverAlt)}"
description: "${esc(description)}"
keywords: "${esc(keywords)}"
published: false
tags: []
products:
  - name: "${esc(affiliate.name)}"
    description: "${esc(affiliate.description)}"
    url: "${affiliate.url}"
    note: "${affiliateNote}"
---

`;

fs.writeFileSync(outFile, frontMatter + md + "\n", { encoding: "utf8" });

// Validate the freshly written article's frontmatter.
try {
  const raw = fs.readFileSync(outFile, "utf8");
  const { data } = matter(raw);
  const meta = {
    slug,
    title: data.title || topic,
    section: data.section,
    categories: Array.isArray(data.categories) ? data.categories : undefined,
    category: data.category,
    brand: data.brand,
    coverImage: data.coverImage,
    coverAlt: data.coverAlt,
    cover: data.cover,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    url: `/articles/${slug}`,
    date: data.date ? String(data.date) : undefined,
    sourceFilePath: outFile,
  };
  const validation = validateArticleMeta(meta);
  if (!validation.isValid) {
    console.warn(
      `[validate-content] Newly generated article has invalid frontmatter (${outFile}):\n  - ${validation.errors.join(
        "\n  - ",
      )}`,
    );
  } else {
    console.log(`✅ Frontmatter valid for ${outFile}`);
  }
} catch (e) {
  console.warn(
    `[validate-content] Could not validate frontmatter for ${outFile}:`,
    e?.message || e,
  );
}

console.log(`\n📝 Wrote: ${outFile}`);
console.log(`   (Place a cover image at: public${coverRel})`);

