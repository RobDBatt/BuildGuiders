// scripts/generate-articles-batch.mjs
// Local-only batch generator for new MDX guides.
// - Uses OpenAI to draft article bodies
// - Writes .mdx files into content/articles
// - Does NOT run during Vercel builds
// Scope rules:
// - BuildGuiders covers living-room home entertainment gear:
//   TVs, receivers/amps, soundbars, fixed game consoles, HDMI/cables, streamers.
// - Do NOT add portable/handheld devices here (Nintendo Switch, Steam Deck, etc.).
//   Those belong on buildguiders-20 later.

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import matter from "gray-matter";
import "dotenv/config";
import { validateArticleMeta } from "../lib/articleValidation.js";
import { inferCategorySlugFromHints } from "../lib/categoryMapping.js";

const cableUrl = "https://www.amazon.com/dp/B0BYP2F7WT/?tag=buildguiders-20";
const truncate = (s, max = 155) => (s.length > max ? `${s.slice(0, max - 1).trim()}…` : s);
const buildKeywords = (parts) => {
  const base = parts
    .join(" ")
    .toLowerCase();
  const tokens = Array.from(
    new Set(
      base
        .split(/[^a-z0-9+]+/i)
        .filter((t) => t && t.length > 2)
        .slice(0, 12),
    ),
  );
  return tokens.join(", ");
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.error(
    "? OPENAI_API_KEY is not set. Set it in your .env file at the project root.",
  );
  process.exit(1);
}

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

// Make sure the directory exists
if (!fs.existsSync(ARTICLES_DIR)) {
  console.error(`? Directory not found: ${ARTICLES_DIR}`);
  process.exit(1);
}

/**
 * Configuration: brands, categories, and which combinations to generate.
 * You can edit these lists as needed.
 */
const BRAND_CONFIG = [
  { key: "lg", label: "LG" },
  { key: "samsung", label: "Samsung" },
  { key: "sony", label: "Sony" },
  { key: "tcl", label: "TCL" },
  { key: "vizio", label: "Vizio" },
  { key: "denon", label: "Denon" },
  { key: "yamaha", label: "Yamaha" },
  { key: "onkyo", label: "Onkyo" },
  { key: "xbox", label: "Xbox" },
  { key: "nvidia", label: "Nvidia" },
  { key: "apple", label: "Apple" },
  { key: "multiple-brands", label: "Multiple Brands" },
  { key: "general", label: "General" },
];

const CATEGORY_CONFIG = [
  {
    key: "tvs",
    category: "tvs",
    categorySlug: "tvs",
    slugSegment: "tv-hdmi-picture-issues",
    titleSuffix: "TV HDMI, picture, and HDR issues",
    coverImage: "/images/gg/gg-tv-general.png",
    baseTags: ["tv", "hdmi", "picture", "hdr"],
  },
  {
    key: "receivers-amps",
    category: "receivers & amps",
    categorySlug: "receivers-amps",
    slugSegment: "receiver-earc-hdmi-issues",
    titleSuffix: "receiver eARC and HDMI issues",
    coverImage: "/images/gg/gg-receiver.png",
    baseTags: ["receiver", "earc", "hdmi"],
  },
  {
    key: "hdmi",
    category: "hdmi",
    categorySlug: "cables-connections",
    slugSegment: "hdmi-no-signal-handshake",
    titleSuffix: "HDMI no-signal and handshake problems",
    coverImage: "/images/gg/gg-hdmi-cables.png",
    baseTags: ["hdmi", "no signal", "handshake"],
  },
  {
    key: "gaming-consoles",
    category: "gaming & consoles",
    categorySlug: "troubleshooting",
    slugSegment: "gaming-console-4k120-hdmi-issues",
    titleSuffix: "gaming console HDMI and 4K/120 issues",
    coverImage: "/images/gg/gg-gaming-console.png",
    baseTags: ["gaming", "4k120", "console"],
  },
  {
    key: "apple-tv",
    category: "apple tv",
    categorySlug: "streaming-devices",
    slugSegment: "apple-tv-hdmi-atmos-issues",
    titleSuffix: "Apple TV 4K HDMI and Atmos issues",
    coverImage: "/images/gg/gg-streaming.png",
    baseTags: ["apple tv", "hdr", "atmos"],
  },
  {
    key: "streamers",
    category: "streamers",
    categorySlug: "streaming-devices",
    slugSegment: "streaming-box-hdmi-hdr-issues",
    titleSuffix: "streaming box HDMI and HDR issues",
    coverImage: "/images/gg/gg-streaming.png",
    baseTags: ["streaming", "4k", "hdr"],
  },
  {
    key: "security-cameras",
    category: "home security",
    categorySlug: "smart-home-security",
    slugSegment: "camera-setup-issues",
    titleSuffix: "security camera setup and connectivity",
    coverImage: "/images/gg/gg-smart-home-device.png",
    baseTags: ["security", "camera", "wifi"],
  },
  {
    key: "smart-locks",
    category: "smart locks",
    categorySlug: "smart-locks",
    slugSegment: "smart-lock-setup-issues",
    titleSuffix: "smart lock installation and pairing",
    coverImage: "/images/gg/gg-smart-home-device.png",
    baseTags: ["smart lock", "bluetooth", "z-wave"],
  },
  {
    key: "climate-control",
    category: "climate control",
    categorySlug: "climate-control",
    slugSegment: "thermostat-wifi-issues",
    titleSuffix: "smart thermostat Wi-Fi and setup",
    coverImage: "/images/gg/gg-smart-home-device.png",
    baseTags: ["thermostat", "hvac", "wifi"],
  },
  {
    key: "network-gear",
    category: "network gear",
    categorySlug: "network-gear",
    slugSegment: "router-mesh-wifi-issues",
    titleSuffix: "router and mesh Wi-Fi optimization",
    coverImage: "/images/gg/gg-smart-home-device.png",
    baseTags: ["router", "mesh", "wifi6"],
  },
];

const ERROR_TOPICS = [
  {
    slug: "lg-oled-error-137-wifi-streaming-fix",
    title: "LG OLED Error 137: streaming app won't connect (fixes)",
    brandKey: "lg",
    categorySlug: "tvs",
    deviceType: "tv",
    errorCode: "137",
    description:
      "How to fix LG TV Error 137 when streaming apps like Netflix or Prime Video fail to connect.",
  },
  {
    slug: "samsung-tv-error-107-internet-connection-fix",
    title: "Samsung TV Error 107: no internet connection (step-by-step fixes)",
    brandKey: "samsung",
    categorySlug: "tvs",
    deviceType: "tv",
    errorCode: "107",
    description:
      "How to restore internet access when your Samsung TV shows Error 107.",
  },
  {
    slug: "roku-error-016-network-problem-fix",
    title: "Roku Error 016: network connection problem (how to fix)",
    brandKey: "roku",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "016",
    description:
      "How to fix Roku Error 016 when the device can’t connect to the internet.",
  },
  {
    slug: "roku-error-014-30-wifi-password-fix",
    title: "Roku Error 014.30: Wi-Fi password or signal issues (fixes)",
    brandKey: "roku",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "014.30",
    description:
      "How to resolve Roku Error 014.30 when Wi-Fi password or signal problems block streaming.",
  },
  {
    slug: "apple-tv-network-timeout-errors-fix",
    title: "Apple TV network timeout: common error codes and fixes",
    brandKey: "apple",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "network-timeout",
    description:
      "How to fix Apple TV network timeout errors when apps fail to load or buffer constantly.",
  },
  {
    slug: "denon-heos-error-1002-connection-failed-fix",
    title: "Denon HEOS Error 1002: connection failed (fixes)",
    brandKey: "denon",
    categorySlug: "receivers-amps",
    deviceType: "avr",
    errorCode: "1002",
    description:
      "How to fix Denon HEOS Error 1002 when your receiver or speaker won’t stay connected.",
  },
  {
    slug: "denon-receiver-protection-mode-error-fix",
    title: "Denon receiver in protection mode: error light and shutdown fixes",
    brandKey: "denon",
    categorySlug: "receivers-amps",
    deviceType: "avr",
    errorCode: "protection-mode",
    description:
      "Why Denon receivers shut down into protection mode and how to fix shorted speaker wires, overheating, or load issues.",
  },
  {
    slug: "yamaha-receiver-check-sp-wires-protect-mode-fix",
    title: "Yamaha receiver ‘CHECK SP Wires’ / protect mode: how to fix",
    brandKey: "yamaha",
    categorySlug: "receivers-amps",
    deviceType: "avr",
    errorCode: "check-sp-wires",
    description:
      "How to resolve Yamaha receiver protect mode messages like ‘CHECK SP Wires’ due to wiring or speaker faults.",
  },
  {
    slug: "sony-tv-firmware-update-error-ce-110-fix",
    title: "Sony TV CE-110 or similar update errors: firmware & network fixes",
    brandKey: "sony",
    categorySlug: "tvs",
    deviceType: "tv",
    errorCode: "CE-110",
    description:
      "How to fix Sony TV firmware update errors like CE-110 caused by unstable networks or storage issues.",
  },
  {
    slug: "ps5-error-ce-108255-1-game-crash-fix",
    title: "PS5 Error CE-108255-1: game keeps crashing (fixes)",
    brandKey: "sony",
    categorySlug: "troubleshooting",
    deviceType: "console",
    errorCode: "CE-108255-1",
    description:
      "How to troubleshoot PS5 Error CE-108255-1 when games crash back to the home screen.",
  },
  {
    slug: "ps5-error-ce-109801-9-network-connection-fix",
    title: "PS5 Error CE-109801-9: network connection failed (fixes)",
    brandKey: "sony",
    categorySlug: "troubleshooting",
    deviceType: "console",
    errorCode: "CE-109801-9",
    description:
      "How to resolve PS5 network errors like CE-109801-9 when online services won’t connect.",
  },
  {
    slug: "xbox-series-x-error-0x87e10024-disc-compatibility-fix",
    title: "Xbox Series X Error 0x87e10024: disc or compatibility issues (fixes)",
    brandKey: "xbox",
    categorySlug: "troubleshooting",
    deviceType: "console",
    errorCode: "0x87e10024",
    description:
      "What Xbox error 0x87e10024 means and how to fix disc or backward compatibility problems.",
  },
  {
    slug: "xbox-error-0x800704cf-network-connection-fix",
    title: "Xbox Error 0x800704cf: network connection problem (fixes)",
    brandKey: "xbox",
    categorySlug: "troubleshooting",
    deviceType: "console",
    errorCode: "0x800704cf",
    description:
      "How to fix Xbox network error 0x800704cf when the console can’t reach Xbox Live.",
  },
  {
    slug: "lg-soundbar-no-audio-over-arc-earc-fix",
    title: "LG soundbar no audio from TV over ARC/eARC: common errors and fixes",
    brandKey: "lg",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "How to fix LG soundbars that show TV ARC/eARC but play no sound.",
  },
  {
    slug: "samsung-soundbar-check-device-power-message-fix",
    title: "Samsung soundbar ‘Check device power’ message: how to fix",
    brandKey: "samsung",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "check-device-power",
    description:
      "How to resolve Samsung soundbar and TV messages like ‘Check device power’ when HDMI ARC fails.",
  },
  {
    slug: "fire-tv-error-plr-prv-1001-playback-fix",
    title: "Fire TV Error PLR_PRV_1001: playback failure (fixes)",
    brandKey: "amazon",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "PLR_PRV_1001",
    description:
      "How to fix Fire TV playback errors like PLR_PRV_1001 from apps such as Prime Video.",
  },
  {
    slug: "chromecast-cant-find-device-setup-error-fix",
    title: "Chromecast ‘can’t find device’ errors: step-by-step fixes",
    brandKey: "google",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "device-not-found",
    description:
      "How to fix Chromecast setup errors when your phone can’t discover the device on Wi-Fi.",
  },
  {
    slug: "lg-tv-no-signal-on-hdmi-error-fix",
    title: "LG TV ‘No Signal’ on HDMI: error checklist and fixes",
    brandKey: "lg",
    categorySlug: "cables-connections",
    deviceType: "tv",
    errorCode: "no-signal-hdmi",
    description:
      "A step-by-step checklist to fix LG TVs that show ‘No Signal’ on HDMI inputs.",
  },
  {
    slug: "samsung-tv-check-cable-connection-hdmi-error-fix",
    title: "Samsung TV ‘Check cable connection’ HDMI error: how to fix",
    brandKey: "samsung",
    categorySlug: "cables-connections",
    deviceType: "tv",
    errorCode: "check-cable-connection",
    description:
      "How to fix Samsung TVs that show ‘Check cable connection’ or similar HDMI errors.",
  },
  {
    slug: "sony-tv-no-audio-over-earc-error-fix",
    title: "Sony TV no audio over eARC: error messages and fixes",
    brandKey: "sony",
    categorySlug: "cables-connections",
    deviceType: "tv",
    errorCode: "no-audio-earc",
    description:
      "How to resolve Sony TV eARC issues when connected to a soundbar or AVR.",
  },
  {
    slug: "soundbar-hdmi-arc-earc-no-sound-fixes",
    title: "HDMI ARC/eARC no sound with soundbar (any brand TV)",
    brandKey: "general",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "Troubleshoot HDMI ARC/eARC no sound on soundbars across any brand of TV.",
  },
  {
    slug: "lg-soundbar-hdmi-arc-earc-no-sound",
    title: "LG soundbar no sound from HDMI ARC / eARC with LG / other TVs",
    brandKey: "lg",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "Fix LG soundbar HDMI ARC/eARC issues when paired with LG or other TVs.",
  },
  {
    slug: "samsung-soundbar-earc-no-sound-or-cutouts",
    title: "Samsung soundbar no sound or cutting out over HDMI ARC / eARC",
    brandKey: "samsung",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "Resolve Samsung soundbar ARC/eARC no sound or intermittent audio dropouts.",
  },
  {
    slug: "sony-soundbar-earc-handshake-issues-fixes",
    title: "Sony soundbar HDMI ARC/eARC handshake issues (no sound / intermittent audio)",
    brandKey: "sony",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "Fix Sony soundbar HDMI ARC/eARC handshake issues causing no sound or intermittent audio.",
  },
  {
    slug: "vizio-soundbar-earc-no-sound-troubleshooting",
    title: "Vizio soundbar no sound from TV HDMI ARC / eARC (picture OK, audio dead)",
    brandKey: "vizio",
    categorySlug: "soundbars",
    deviceType: "soundbar",
    errorCode: "no-audio-arc",
    description:
      "Troubleshoot Vizio soundbars when ARC/eARC shows picture but no audio.",
  },
  {
    slug: "streaming-box-hdmi-no-signal-black-screen-checklist",
    title: "Streaming box HDMI no signal / black screen troubleshooting checklist (any brand)",
    brandKey: "general",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "no-signal",
    description:
      "Checklist to fix HDMI no signal or black screen on any brand of streaming box.",
  },
  {
    slug: "nvidia-shield-4k-hdr-dolby-atmos-not-working",
    title: "NVIDIA Shield 4K HDR / Dolby Atmos not working on TV or receiver",
    brandKey: "nvidia",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "hdr-atmos-fail",
    description:
      "Fix NVIDIA Shield when 4K HDR or Dolby Atmos fails through a TV or receiver.",
  },
  {
    slug: "sony-google-tv-streaming-no-atmos-or-4k-hdr",
    title: "Sony Google TV / built-in streaming apps don’t output Atmos or 4K HDR through receiver",
    brandKey: "sony",
    categorySlug: "streaming-devices",
    deviceType: "streaming",
    errorCode: "hdr-atmos-fail",
    description:
      "Troubleshoot Sony Google TV built-in apps that refuse to output Atmos or 4K HDR via receiver.",
  },
  {
    slug: "subwoofer-no-sound-with-av-receiver-troubleshooting",
    title: "Subwoofer not working with AV receiver (no bass or intermittent bass)",
    brandKey: "general",
    categorySlug: "speakers-subwoofers",
    deviceType: "avr",
    errorCode: "no-bass",
    description:
      "Diagnose subwoofers that produce no bass or intermittent bass when paired with an AV receiver.",
  },
  {
    slug: "apple-tv-4k-not-detected-tv-or-only-1080p-modes",
    title: "Apple TV 4K not detected on TV HDMI / only 1080p modes available",
    brandKey: "apple",
    categorySlug: "tvs",
    deviceType: "tv",
    errorCode: "no-4k",
    description:
      "Fix Apple TV 4K when the TV only shows 1080p modes or fails to detect the box on HDMI.",
  },
];

// Matrix of which brand/category combinations to generate.
const BRAND_CATEGORY_MATRIX = [
  // TVs - per-brand HDMI / picture / HDR issues
  { brandKey: "lg", categoryKey: "tvs" },
  { brandKey: "samsung", categoryKey: "tvs" },
  { brandKey: "sony", categoryKey: "tvs" },
  { brandKey: "tcl", categoryKey: "tvs" },
  { brandKey: "vizio", categoryKey: "tvs" },

  // Receivers & amps - eARC/ARC and HDMI passthrough
  { brandKey: "denon", categoryKey: "receivers-amps" },
  { brandKey: "yamaha", categoryKey: "receivers-amps" },
  { brandKey: "onkyo", categoryKey: "receivers-amps" },

  // HDMI & handshake - general and multi-brand
  { brandKey: "general", categoryKey: "hdmi" },
  { brandKey: "multiple-brands", categoryKey: "hdmi" },

  // Gaming & consoles - fixed consoles only
  { brandKey: "xbox", categoryKey: "gaming-consoles" },
  { brandKey: "sony", categoryKey: "gaming-consoles" }, // PS5
  { brandKey: "nvidia", categoryKey: "gaming-consoles" },

  // Streamers / Apple TV
  { brandKey: "apple", categoryKey: "apple-tv" },
  { brandKey: "multiple-brands", categoryKey: "streamers" },
];

function findBrand(key) {
  const normalized = key.trim().toLowerCase();
  return BRAND_CONFIG.find(
    (b) => b.key.trim().toLowerCase() === normalized,
  );
}

function findCategory(key) {
  const normalized = key.trim().toLowerCase();
  return CATEGORY_CONFIG.find(
    (c) => c.key.trim().toLowerCase() === normalized,
  );
}

function buildArticleSlug(brand, category) {
  const raw = `${brand.key}-${category.slugSegment}-troubleshooting-guide`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Check if a file already exists.
 */
async function articleFileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate an MDX body (no frontmatter) for a single article spec.
 */
async function generateArticleBody(spec) {
  const { title, brand, category, errorCode, deviceType } = spec;

  const systemPrompt =
    "You are a clear, friendly technical writer for BuildGuiders." +
    " You write step-by-step home entertainment troubleshooting guides in plain language." +
    " No prices, no ratings, no hype, no raw HTML/JSX." +
    " Always include exactly one in-body affiliate link labeled with '(paid link)'." +
    " BuildGuiders covers living-room gear only (TVs, receivers, soundbars, fixed consoles, HDMI/cables, streaming devices)." +
    " Avoid portable/handheld topics." +
    " Menu labels must be plausible for 2020–2025 models; if unsure, give generic options instead of inventing strings.";

  const userPrompt = `
Write an MDX article body (NO frontmatter).

Title: ${title}
Brand: ${brand}
Category: ${category}
${errorCode ? `Error: ${errorCode}\n` : ""}${deviceType ? `Device type: ${deviceType}\n` : ""}

Structure (use H2s in this order):
- Quick answer (3–4 actionable bullets)
- Symptoms
- Quick checks
- Step-by-step fix (numbered)
- If it still doesn’t work
- FAQ (3–5 Q&As, real who/what/why/how queries)
- Related fixes (1–3 internal links to /articles/...)

Rules:
- Begin with a single H1 matching the title.
- Insert exactly one contextual affiliate link: [Certified Ultra High Speed HDMI cable (paid link)](${cableUrl}) where it helps most. No other affiliate links.
- No prices, ratings, or time-sensitive claims.
- Keep tone calm and direct; avoid filler.
- If not sure of exact menu names, offer likely options instead of inventing.
`.trim();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 1800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI for " + spec.slug);
  }
  return content.trim();
}

/**
 * Build frontmatter string for an article.
 */
function buildFrontmatter(spec) {
  const { slug, title, brand, category, coverImage, tags, published } = spec;
  const date = new Date().toISOString().slice(0, 10);

  const safeTitle = title.replace(/"/g, '\"');

  // Generate a basic description
  const description = truncate(
    `Troubleshooting guide for ${brand} ${category}: ${title}. Clear steps, quick checks, and settings to stabilize the setup without fluff.`,
  );

  // Generate keywords from tags, brand, and category
  const keywords = buildKeywords([brand, category, title, ...(tags || [])]);

  // Generate a basic coverAlt
  const coverAlt = `${brand} ${category} setup or device`;

  const tagsYaml =
    Array.isArray(tags) && tags.length > 0
      ? "\n" + "tags:\n" + tags.map((t) => `  - "${t}"`).join("\n")
      : "";

  const resolvedPublished =
    typeof published === "boolean" ? published : false;
  const publishedLine = `\npublished: ${resolvedPublished ? "true" : "false"}`;

  const productsYaml =
    "\nproducts:\n" +
    "  - name: \"Certified Ultra High Speed HDMI Cable\"\n" +
    "    description: \"Certified HDMI 2.1 cable to stabilize HDMI/eARC links for common A/V fixes.\"\n" +
    `    url: \"${cableUrl}\"\n` +
    "    note: \"Paid link: BuildGuiders may earn a commission at no extra cost to you.\"";
  return (
    `---\nslug: ${slug}\ntitle: "${safeTitle}"\nbrand: "${brand}"\ncategory: "${category}"\ncoverImage: "${coverImage}"\ncoverAlt: "${coverAlt}"\ndescription: "${description.replace(/"/g, '\\"')}"\nkeywords: "${keywords.replace(/"/g, '\\"')}"\ndate: "${date}"${publishedLine}${tagsYaml}${productsYaml}\n---\n\n`
  );
}

/**
 * Generate and write a single article for a brand/category combo.
 */
async function generateArticleMdx(brandConfig, categoryConfig) {
  const slug = buildArticleSlug(brandConfig, categoryConfig);
  const fileName = `${slug}.mdx`;
  const targetPath = path.join(ARTICLES_DIR, fileName);

  if (await articleFileExists(targetPath)) {
    console.log(`?  Skipping existing file: ${fileName}`);
    return;
  }

  const title = `Fix ${brandConfig.label} ${categoryConfig.titleSuffix}`;

  const tags = [
    brandConfig.key,
    categoryConfig.key,
    ...(categoryConfig.baseTags || []),
  ];

  const categorySlug =
    categoryConfig.categorySlug ??
    inferCategorySlugFromHints([
      title,
      brandConfig.label,
      categoryConfig.titleSuffix,
      ...(categoryConfig.baseTags || []),
    ]);

  const spec = {
    slug,
    title,
    brand: brandConfig.label,
    category: categorySlug,
    coverImage: categoryConfig.coverImage,
    tags,
  };

  try {
    console.log(`?? Generating: ${title}`);
    const body = await generateArticleBody(spec);
    const frontmatter = buildFrontmatter(spec);
    const fullContent = frontmatter + body + "\n";

    await fs.promises.writeFile(targetPath, fullContent, "utf8");

    // Validate the freshly written article's frontmatter.
    try {
      const raw = fs.readFileSync(targetPath, "utf8");
      const { data } = matter(raw);
      const meta = {
        slug,
        title: data.title || title,
        section: data.section,
        categories: Array.isArray(data.categories)
          ? data.categories
          : undefined,
        category: data.category,
        brand: data.brand,
        coverImage: data.coverImage,
        coverAlt: data.coverAlt,
        cover: data.cover,
        tags: Array.isArray(data.tags) ? data.tags : undefined,
        url: `/articles/${slug}`,
        date: data.date ? String(data.date) : undefined,
        sourceFilePath: targetPath,
      };
      const validation = validateArticleMeta(meta);
      if (!validation.isValid) {
        console.warn(
          `[validate-content] Newly generated article has invalid frontmatter (${targetPath}):\n  - ${validation.errors.join(
            "\n  - ",
          )}`,
        );
      } else {
        console.log(
          `? Frontmatter valid for ${path.relative(ROOT, targetPath)}`,
        );
      }
    } catch (e) {
      console.warn(
        `[validate-content] Could not validate frontmatter for ${targetPath}:`,
        e?.message || e,
      );
    }

    console.log(`? Created: ${path.relative(ROOT, targetPath)}\n`);
  } catch (err) {
    console.error(`? Failed to generate ${slug}:`, err.message || err);
  }
}

/**
 * Generate and write a single error-code style article.
 */
async function generateErrorArticle(topic) {
  const brand = findBrand(topic.brandKey) ?? { key: topic.brandKey, label: topic.brandKey };

  const fileName = `${topic.slug}.mdx`;
  const targetPath = path.join(ARTICLES_DIR, fileName);

  if (await articleFileExists(targetPath)) {
    console.log(`?  Skipping existing error article: ${fileName}`);
    return;
  }

  const tags = [
    brand.key,
    "error-code",
    topic.errorCode,
    topic.deviceType,
  ].filter(Boolean);

  const categorySlug =
    topic.categorySlug ??
    inferCategorySlugFromHints([
      topic.title,
      brand.label,
      topic.description,
    ]);

  const spec = {
    slug: topic.slug,
    title: topic.title,
    brand: brand.label,
    category: categorySlug,
    coverImage: CATEGORY_CONFIG.find(c => c.categorySlug === categorySlug)?.coverImage ?? "/images/covers/cover-network.png",
    tags,
    errorCode: topic.errorCode,
    deviceType: topic.deviceType,
  };

  try {
    console.log(`?? Generating error article: ${topic.title}`);
    const body = await generateArticleBody(spec);
    const frontmatter = buildFrontmatter(spec);
    const fullContent = frontmatter + body + "\n";

    await fs.promises.writeFile(targetPath, fullContent, "utf8");

    console.log(`? Created error article: ${path.relative(ROOT, targetPath)}\n`);
  } catch (err) {
    console.error(`? Failed to generate error article ${topic.slug}:`, err.message || err);
  }
}

/**
 * Main runner: loop through brand/category matrix and generate missing articles.
 */
async function main() {
  console.log("?? Generating batch of articles for BuildGuiders...\n");

  for (const entry of BRAND_CATEGORY_MATRIX) {
    const brand = findBrand(entry.brandKey);
    const category = findCategory(entry.categoryKey);

    if (!brand) {
      console.warn(`?  Unknown brand key in matrix: ${entry.brandKey}`);
      continue;
    }
    if (!category) {
      console.warn(`?  Unknown category key in matrix: ${entry.categoryKey}`);
      continue;
    }

    await generateArticleMdx(brand, category);
  }

  console.log("?? Generating error-code articles...\n");

  for (const topic of ERROR_TOPICS) {
    await generateErrorArticle(topic);
  }

  console.log("?? Batch generation complete.");
}

main().catch((err) => {
  console.error("? Unhandled error in batch generator:", err);
  process.exit(1);
});
