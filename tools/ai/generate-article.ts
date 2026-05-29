// tools/ai/generate-article.ts
// Generate a solution article (.mdx). Uses OpenAI with robust fallbacks and a scaffold on quota errors.

import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

import OpenAI from "openai";

// ---------- Types ----------
type Topic = {
  slug: string;              // e.g. "apple-tv-4k-match-frame-rate-dolby-vision-settings"
  title: string;             // e.g. "Apple TV 4K: match frame rate & Dolby Vision settings"
  description?: string;
  brandFocus?: string[];     // e.g. ["Apple","LG","Denon"]
  tags?: string[];           // e.g. ["apple-tv","hdr","dolby-vision"]
  sources?: string[];        // optional references you collected
  recommend?: string[];      // product keys to pull from products.json
};

type Product = { name: string; out: string }; // { name: "Denon AVR-X1700H", out: "/out/denon-x1700h" }

// ---------- Paths ----------
const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const PRODUCTS_PATH = path.join(ROOT, "tools", "ai", "products.json");

// ---------- Env / Client ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing. Add it to .env.local or set $env:OPENAI_API_KEY.");
  process.exit(1);
}
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// Model order: primary → backup → tertiary
const MODEL_ORDER = [
  process.env.AI_MODEL_PRIMARY  || process.env.AI_MODEL || "gpt-4o-mini",
  process.env.AI_MODEL_BACKUP   || "gpt-4.1-mini",
  process.env.AI_MODEL_TERTIARY || "gpt-4o",
];

// ---------- Helpers ----------
function esc(s: string) { return (s || "").replace(/"/g, '\\"'); }

function ensureSafeSlug(slug: string): string {
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    // reduce to safe
    const safe = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!safe) throw new Error(`Invalid slug "${slug}"`);
    return safe;
  }
  return slug;
}

function toFrontmatter(t: Topic): string {
  const date = new Date().toISOString().slice(0,10);
  const tags = (t.tags || []).map(v => `"${esc(v)}"`).join(", ");
  return [
    "---",
    `title: "${esc(t.title)}"`,
    `description: "${esc(t.description || "")}"`,
    `date: ${date}`,
    `draft: false`,
    `tags: [${tags}]`,
    "---",
    ""
  ].join("\n");
}

function scaffoldFromTopic(t: Topic, picks: Product[]) {
  const fm = toFrontmatter(t);
  const picksMd = picks.length
    ? picks.map(p => `- **${p.name}** — (paid link): ${p.out}`).join("\n")
    : "- (add picks)";
  return (
`${fm}> Draft scaffold created because AI quota/access was unavailable. Fill in and re-run later to upgrade.

## TL;DR
- …

## Steps
1. …
2. …

## Troubleshooting
- …

## Buy Once picks
${picksMd}

## More
- [All articles](/articles)
`);
}

async function readJSON<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function chatWithFallback(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], maxTokens = 1600) {
  let lastErr: any;
  for (const model of MODEL_ORDER) {
    try {
      return await client.chat.completions.create({
        model,
        temperature: 0.4,
        max_tokens: maxTokens,
        messages,
      });
    } catch (e: any) {
      lastErr = e;
      const code = e?.code || e?.error?.code;
      const status = e?.status;
      // Retry on common recoverable issues (403 model_not_found, 429 quota/rate)
      if (code === "model_not_found" || status === 403 || code === "insufficient_quota" || status === 429) {
        continue;
      }
      // Fatal (e.g., invalid_request, malformed prompt, etc.)
      throw e;
    }
  }
  throw lastErr;
}

// ---------- Main ----------
async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npx tsx tools/ai/generate-article.ts tools/ai/topic.json");
    process.exit(1);
  }

  // Load topic and optional products
  const rawTopic = await readJSON<Topic>(inputPath, {} as Topic);
  if (!rawTopic?.slug || !rawTopic?.title) {
    console.error("❌ topic JSON must include at least { slug, title }");
    process.exit(1);
  }
  const slug = ensureSafeSlug(rawTopic.slug);
  const productsDict = await readJSON<Record<string, Product>>(PRODUCTS_PATH, {});
  const picks: Product[] = (rawTopic.recommend || []).map(k => productsDict[k]).filter(Boolean);

  // Compose prompt
  const system = [
    "You are a precise home-theater troubleshooter & editor.",
    "Write concise, actionable GitHub-Flavored Markdown only.",
    "Structure strictly: TL;DR (bullets), Steps (numbered), Troubleshooting (bullets), Buy Once picks (bullets), More.",
    "In Buy Once picks, use format: **Name** — (paid link): /out/slug",
    "No prices/ratings/coupons or availability claims.",
    "Be exact with menu names, HDMI labels (e.g., 'HDMI 2.1 / 4K120'), and toggles.",
    "If uncertain, say so and suggest a safe test."
  ].join(" ");

  const userPayload = {
    frontmatter: {
      title: rawTopic.title,
      description: rawTopic.description || "",
      date: new Date().toISOString().slice(0,10),
      draft: false,
      tags: rawTopic.tags || []
    },
    brief: {
      slug,
      brandFocus: rawTopic.brandFocus || [],
      sources: rawTopic.sources || []
    },
    products: picks,
    compliance: {
      amazon: "Label links as (paid link). No prices/ratings. Avoid time-sensitive claims.",
      ftc: "Site shows a disclosure banner; no extra long disclaimers in body."
    },
    output: {
      sections: ["TL;DR","Steps","Troubleshooting","Buy Once picks","More"],
      internalLinks: ["/articles"]
    }
  };

  // Try AI → fallback to scaffold if quota/access blocked
  let md: string | undefined;
  try {
    const resp = await chatWithFallback(
      [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "Generate the article in Markdown. Start with YAML frontmatter (--- ... ---) that matches the provided frontmatter.\n" +
            "Then write the sections: TL;DR, Steps, Troubleshooting, Buy Once picks, More.\n" +
            "Use provided products in Buy Once picks with '(paid link)' and the '/out/slug' URL.\n\n" +
            JSON.stringify(userPayload, null, 2)
        }
      ],
      1600
    );
    md = resp.choices?.[0]?.message?.content?.trim();
  } catch (e: any) {
    const code = e?.code || e?.error?.code || e?.status;
    console.warn(`⚠️ OpenAI call failed [${code}]. Will write a scaffold instead.`);
    md = undefined;
  }

  if (!md || !md.includes("---")) {
    // Ensure we always produce a usable file
    md = scaffoldFromTopic(rawTopic, picks);
  }

  // Write file
  await fs.mkdir(ARTICLES_DIR, { recursive: true });
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  await fs.writeFile(filePath, md, { encoding: "utf8" });

  console.log("✅ Wrote", filePath);
  console.log("ℹ️  Models tried (in order):", MODEL_ORDER.join(" → "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
