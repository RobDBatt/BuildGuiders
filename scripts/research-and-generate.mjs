// scripts/research-and-generate.mjs
// Hits Google Autocomplete with material+intent seeds, scores by buying-guide
// intent, filters existing slugs, checks home-improvement relevance, deduplicates
// fuzzy matches, and generates up to MAX_NEW_ARTICLES via the Gemini API.
//
// Articles are buying guides that cross-link to a BuildGuiders calculator. The
// calculator list is read from lib/calculators.ts at run time rather than copied
// here — that file exists precisely so the homepage and /calculators hub cannot
// drift, and a generator holding its own stale copy would reintroduce the drift
// it was created to prevent. A new calculator becomes available to the generator
// the moment it lands in that file.

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
// How many articles one run may write. Set MAX_NEW_ARTICLES to override; the
// workflow exposes it as the "count" input so a first run can be small enough
// to actually read. Falls back to 20, which is what the script has always done
// when run by hand.
const ARTICLE_COUNT_DEFAULT = 20;
const ARTICLE_COUNT_CEILING = 50;
const MAX_NEW_ARTICLES = resolveArticleCount(process.env.MAX_NEW_ARTICLES);

// Validated rather than coerced: Number("") is 0 and Number("3 ") is 3, so a
// blank or fat-fingered value would otherwise silently produce no articles, or
// far too many, and the bill arrives either way.
export function resolveArticleCount(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return ARTICLE_COUNT_DEFAULT;
  }
  const n = Number(String(raw).trim());
  if (!Number.isInteger(n) || n < 1 || n > ARTICLE_COUNT_CEILING) {
    throw new Error(
      `MAX_NEW_ARTICLES must be a whole number between 1 and ` +
        `${ARTICLE_COUNT_CEILING}, got "${raw}".`,
    );
  }
  return n;
}

// Gemini model. Overridable because model names move faster than this file:
// run `npm run models` to list what the key can actually reach, then set
// GEMINI_MODEL to one of them. The default is the one the earlier Gemini
// scripts on the old branch used, and it is still current.
const MODEL = normalizeModelName(process.env.GEMINI_MODEL) || "gemini-2.5-flash";

// Output budget for one article. The prompt asks for 700-900 words, which is
// roughly 1,200 tokens — but gemini-2.5-flash is a thinking model and its
// reasoning tokens come out of this same allowance. At 2,500 the first real run
// produced one article cut mid-word and one missing its entire back half,
// because thinking had eaten most of the budget before the prose started.
// Generous rather than tight: unused budget costs nothing, a truncated article
// costs a regeneration.
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 8000;

// The API rejects the "models/" prefix that its own list endpoint returns, which
// is an easy way to set GEMINI_MODEL to something that looks right and 404s.
function normalizeModelName(name) {
  if (!name) return null;
  return name.trim().replace(/^models\//, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATORS — single source of truth is lib/calculators.ts
// ─────────────────────────────────────────────────────────────────────────────

const CALCULATOR_HUB = "/calculators";

// Parsed rather than imported: this is a .mjs script and that file is TypeScript,
// so importing it would need a build step. Each calculator object lists title
// before href, and the group metadata below them uses eyebrow/heading/items, so
// there is nothing else in the file for these two patterns to catch.
export function loadCalculators() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "calculators.ts"), "utf8");
  const titles = [...src.matchAll(/^\s*title:\s*"([^"]+)"/gm)].map((m) => m[1]);
  const hrefs = [...src.matchAll(/^\s*href:\s*"([^"]+)"/gm)].map((m) => m[1]);

  if (titles.length === 0 || titles.length !== hrefs.length) {
    throw new Error(
      `lib/calculators.ts parsed to ${titles.length} titles and ${hrefs.length} hrefs. ` +
        "The file's shape changed — update loadCalculators() to match rather than " +
        "hardcoding a list here.",
    );
  }
  return titles.map((title, i) => ({ title, href: hrefs[i] }));
}

// Content category -> calculator. Parsed from the categoryCalculators map in
// lib/calculators.ts rather than kept here, because a copy in this file is how
// the generator came to know 14 categories while the guide template still knew
// 9 — which made a roofing or pool guide render no calculator CTA at all.
export function loadCategoryCalculators() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "calculators.ts"), "utf8");
  const block = src.match(
    /export const categoryCalculators[\s\S]*?=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) {
    throw new Error(
      "Could not find the categoryCalculators map in lib/calculators.ts. " +
        "If it moved or was renamed, update loadCategoryCalculators() to match " +
        "rather than hardcoding the mapping here.",
    );
  }
  const entries = [
    ...block[1].matchAll(/["']?([a-z-]+)["']?:\s*\{\s*href:\s*"([^"]+)"/g),
  ];
  if (entries.length === 0) {
    throw new Error("categoryCalculators parsed to zero entries.");
  }
  return Object.fromEntries(entries.map((m) => [m[1], m[2]]));
}

export function validateCalculatorMap(calculators, categoryMap = loadCategoryCalculators()) {
  const live = new Set(calculators.map((c) => c.href));
  const dead = Object.entries(categoryMap).filter(
    ([, href]) => !live.has(href),
  );
  if (dead.length > 0) {
    throw new Error(
      "categoryCalculators points at calculators that do not exist in " +
        "lib/calculators.ts:\n" +
        dead.map(([cat, href]) => `  ${cat} -> ${href}`).join("\n"),
    );
  }
  const unmapped = calculators.filter(
    (c) => !Object.values(categoryMap).includes(c.href),
  );
  if (unmapped.length > 0) {
    console.warn(
      "Note: no content category routes to " +
        unmapped.map((c) => c.href).join(", ") +
        " — articles in those areas will link to the hub instead.",
    );
  }
}

let categoryMapCache = null;

export function calculatorFor(categorySlug) {
  if (!categoryMapCache) categoryMapCache = loadCategoryCalculators();
  return categoryMapCache[categorySlug] || CALCULATOR_HUB;
}

// Human name for a calculator path, taken from lib/calculators.ts so the prompt
// calls it whatever the site calls it.
let calculatorIndex = null;

function calculatorLabel(href) {
  if (!calculatorIndex) {
    calculatorIndex = new Map(loadCalculators().map((c) => [c.href, c.title]));
  }
  return calculatorIndex.get(href) || "our calculators";
}

// Primary material/product categories — used as the first seed term
const CATEGORIES = [
  // Paint
  "interior paint", "exterior paint", "bathroom paint", "ceiling paint",
  "primer", "deck paint", "concrete paint", "garage floor paint",
  // Flooring
  "hardwood flooring", "vinyl plank flooring", "LVP flooring",
  "laminate flooring", "engineered hardwood", "tile flooring",
  "carpet", "underlayment",
  // Tile
  "bathroom tile", "floor tile", "shower tile", "backsplash tile",
  "porcelain tile", "ceramic tile", "grout", "tile adhesive",
  // Deck
  "composite decking", "pressure treated decking", "deck boards",
  "deck screws", "deck railing",
  // Drywall
  "drywall", "joint compound", "drywall tape", "drywall screws",
  "drywall anchors",
  // Mulch & landscaping
  "mulch", "wood mulch", "rubber mulch", "topsoil", "landscape fabric",
  "garden edging",
  // Concrete
  "concrete mix", "post hole concrete", "concrete sealer",
  "concrete resurfacer",
  // Fence
  "vinyl fence", "wood fence", "privacy fence", "chain link fence",
  "fence panels", "fence posts",
  // Stain & sealer
  "deck stain", "wood stain", "deck sealer", "wood sealer",
  "fence stain", "exterior wood finish",
  // Roofing
  "asphalt shingles", "roof shingles", "metal roofing",
  "roofing underlayment", "drip edge", "roof vents", "roof sealant",
  // Lawn
  "grass seed", "lawn fertilizer", "starter fertilizer", "sod",
  "lawn soil", "straw mat",
  // Raised beds & garden soil
  "raised garden bed", "garden soil", "raised bed soil", "compost",
  "potting mix", "perlite",
  // Pool
  "pool chlorine", "pool shock", "pool test kit", "pool filter",
  "pool pump", "pool cover", "pool chemicals",
  // Wallpaper
  "wallpaper", "peel and stick wallpaper", "wallpaper paste",
  "wallpaper primer", "wallpaper removal",
];

// Buying intent modifiers — combined with CATEGORIES as seed pairs
const INTENTS = [
  "best", "vs", "review", "brands", "types", "for bathroom",
  "for kitchen", "for bedroom", "for garage", "for outdoor",
  "for high traffic", "for pets", "waterproof", "how to choose",
  "comparison", "coverage per gallon", "coverage per square foot",
  "color options", "how to apply", "top rated", "most durable",
  "cheapest", "premium", "budget", "professional grade",
];

// Signals that indicate buying/research intent — BOOST these
const HIGH_INTENT = [
  "best", "top", "vs", "review", "comparison", "rated",
  "recommended", "choose", "pick", "brands", "types",
  "coverage", "durable", "waterproof", "mold resistant",
  "for bathroom", "for kitchen", "for outdoor", "for pets",
  "per gallon", "per square foot", "how many", "how much",
];

// Topics to skip — off-brand or not actionable for buying guides
const IGNORE_TERMS = [
  "diy tutorial", "how to install", "step by step install",
  "tool rental", "contractor cost", "labor cost", "permit",
  "recycling", "disposal", "painting service near me",
  "home depot near me", "lowes near me", "price per square foot installed",
  "news", "recall", "lawsuit", "class action",
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC-AWARE PRODUCT SELECTION
// Picks an affiliate product relevant to the article slug/category.
// ─────────────────────────────────────────────────────────────────────────────

function pickProductForTopic(slug, categorySlug) {
  const topic = ((slug || "") + " " + (categorySlug || "")).toLowerCase();
  const has = (...words) => words.some((w) => topic.includes(w));

  // PAINT
  if (has("exterior-paint", "exterior paint", "outside paint", "house-paint")) {
    return {
      name: "Sherwin-Williams Emerald Exterior Paint",
      description:
        "Sherwin-Williams Emerald Exterior is one of the highest-rated exterior paints for durability and hide. Self-priming formula covers in one coat on most surfaces and resists dirt, mildew, and UV fading.",
      url: "https://www.amazon.com/s?k=Sherwin-Williams+Emerald+Exterior+Paint&tag=buildguiders-20",
    };
  }
  if (has("bathroom", "bath", "moisture", "humid", "mold", "mildew") && has("paint")) {
    return {
      name: "Zinsser Perma-White Mold & Mildew Proof Paint",
      description:
        "Zinsser Perma-White is specifically formulated for bathrooms and high-humidity areas. Guaranteed mold and mildew proof finish — works over existing paint without priming.",
      url: "https://www.amazon.com/s?k=Zinsser+Perma-White+Bathroom+Paint&tag=buildguiders-20",
    };
  }
  if (has("ceiling-paint", "ceiling paint")) {
    return {
      name: "BEHR Premium Plus Ultra Ceiling Paint",
      description:
        "A flat-finish ceiling paint that hides imperfections and covers well in one coat. Low splatter formula makes application clean and easy.",
      url: "https://www.amazon.com/s?k=Behr+Ceiling+Paint+White+Flat&tag=buildguiders-20",
    };
  }
  if (has("primer")) {
    return {
      name: "Zinsser Bulls Eye 1-2-3 Primer",
      description:
        "Bonds to all surfaces without sanding, seals stains, and provides a uniform base for topcoats. The go-to primer for new drywall, dark color changes, and bare wood.",
      url: "https://www.amazon.com/s?k=Zinsser+Bulls+Eye+1-2-3+Primer&tag=buildguiders-20",
    };
  }
  if (has("paint", "interior") || has("interior-paint")) {
    return {
      name: "BEHR Premium Plus Interior Paint and Primer",
      description:
        "One of the best-reviewed interior paints for everyday rooms. Paint and primer in one, excellent hide, low VOC, and available in thousands of colors.",
      url: "https://www.amazon.com/s?k=Behr+Premium+Plus+Interior+Paint+and+Primer&tag=buildguiders-20",
    };
  }

  // FLOORING
  if (has("hardwood", "wood-floor", "wood floor", "solid-hardwood")) {
    return {
      name: "Bruce Hardwood Flooring",
      description:
        "Bruce is one of the most trusted hardwood flooring brands, with a wide range of species, stains, and widths. Pre-finished planks eliminate on-site finishing time.",
      url: "https://www.amazon.com/s?k=Bruce+hardwood+flooring+prefinished&tag=buildguiders-20",
    };
  }
  if (has("lvp", "vinyl-plank", "vinyl plank", "luxury-vinyl") || (has("vinyl") && has("floor"))) {
    return {
      name: "LifeProof Rigid Core Luxury Vinyl Plank Flooring",
      description:
        "LifeProof is a top-rated waterproof LVP with attached underlayment and a click-lock install. Ideal for kitchens, bathrooms, and basements where moisture resistance matters.",
      url: "https://www.amazon.com/s?k=LifeProof+luxury+vinyl+plank+flooring&tag=buildguiders-20",
    };
  }
  if (has("laminate")) {
    return {
      name: "Pergo Outlast+ Laminate Flooring",
      description:
        "Pergo Outlast+ is the most water-resistant laminate in its class, with a 24-hour spill protection guarantee. Thicker than standard laminate for a more solid underfoot feel.",
      url: "https://www.amazon.com/s?k=Pergo+Outlast+laminate+flooring&tag=buildguiders-20",
    };
  }
  if (has("underlayment")) {
    return {
      name: "Roberts Super Felt Underlayment",
      description:
        "A dense felt underlayment that provides sound dampening, thermal insulation, and cushioning under hardwood, laminate, and LVP. Compatible with radiant heat floors.",
      url: "https://www.amazon.com/s?k=Roberts+Super+Felt+flooring+underlayment&tag=buildguiders-20",
    };
  }
  if (has("carpet")) {
    return {
      name: "Mohawk SmartStrand Carpet",
      description:
        "SmartStrand's built-in stain resistance is part of the fiber itself, not a topical coating — meaning it never washes out. One of the most durable residential carpet lines.",
      url: "https://www.amazon.com/s?k=Mohawk+SmartStrand+carpet&tag=buildguiders-20",
    };
  }

  // TILE
  if (has("grout")) {
    return {
      name: "Mapei Ultracolor Plus FA Grout",
      description:
        "A professional-grade unsanded and sanded grout that resists staining, efflorescence, and cracking. Ready to use with no sealer required — works for floors, walls, and showers.",
      url: "https://www.amazon.com/s?k=Mapei+Ultracolor+Plus+FA+grout&tag=buildguiders-20",
    };
  }
  if (has("tile-adhesive", "tile adhesive", "thinset", "mortar") && has("tile")) {
    return {
      name: "Mapei Ultraflex 2 Polymer-Modified Mortar",
      description:
        "Mapei Ultraflex 2 bonds floor and wall tiles on almost any substrate including wood subfloors. Polymer-modified formula handles movement without cracking grout joints.",
      url: "https://www.amazon.com/s?k=Mapei+Ultraflex+2+tile+mortar&tag=buildguiders-20",
    };
  }
  if (has("shower", "bathroom") && has("tile")) {
    return {
      name: "Schluter Ditra Uncoupling Membrane",
      description:
        "Ditra is the industry-standard uncoupling membrane for tile over wood subfloors in bathrooms and showers. Prevents cracked grout and loose tiles caused by subfloor movement.",
      url: "https://www.amazon.com/s?k=Schluter+Ditra+uncoupling+membrane&tag=buildguiders-20",
    };
  }
  if (has("tile")) {
    return {
      name: "Daltile Ceramic Floor and Wall Tile",
      description:
        "Daltile is one of the most widely available tile brands in the US, offering consistent quality across porcelain and ceramic in dozens of sizes and finishes.",
      url: "https://www.amazon.com/s?k=Daltile+ceramic+tile+floor&tag=buildguiders-20",
    };
  }

  // DECK
  if (has("composite", "trex", "timbertech", "fiberon", "composite-deck")) {
    return {
      name: "Trex Enhance Naturals Composite Decking",
      description:
        "Trex Enhance is the entry-level composite deck board from the market's leading brand. 25-year fade and stain warranty, no sanding or staining required, and available in 8 earthy tones.",
      url: "https://www.amazon.com/s?k=Trex+Enhance+Naturals+composite+decking&tag=buildguiders-20",
    };
  }
  if (has("deck-screw", "deck screw", "decking-screw")) {
    return {
      name: "Grip-Rite Exterior Screws for Composite Decking",
      description:
        "Code-compliant exterior screws with a coating that resists corrosion from ACQ-treated lumber and composite boards. Self-countersinking head leaves a clean finish.",
      url: "https://www.amazon.com/s?k=Grip-Rite+exterior+deck+screws+composite&tag=buildguiders-20",
    };
  }
  if (has("deck-railing", "deck railing", "railing")) {
    return {
      name: "Fortress Building Products Railing",
      description:
        "Powder-coated aluminum railing that meets code for most residential decks. Maintenance-free, no painting or staining required, and compatible with composite and wood decks.",
      url: "https://www.amazon.com/s?k=Fortress+aluminum+deck+railing&tag=buildguiders-20",
    };
  }
  if (has("deck") && !has("stain", "sealer", "paint")) {
    return {
      name: "Trex Enhance Naturals Composite Decking",
      description:
        "Trex Enhance is the most popular entry-point composite decking product. Lifetime structural warranty plus 25-year fade/stain protection — no annual maintenance required.",
      url: "https://www.amazon.com/s?k=Trex+Enhance+composite+decking&tag=buildguiders-20",
    };
  }

  // DRYWALL
  if (has("joint-compound", "joint compound", "mud", "drywall-mud")) {
    return {
      name: "USG Sheetrock All Purpose Joint Compound",
      description:
        "The most widely used joint compound in the US. Premixed, smooth consistency, and sands easily. Works for taping, topping, and texture coats.",
      url: "https://www.amazon.com/s?k=USG+Sheetrock+all+purpose+joint+compound&tag=buildguiders-20",
    };
  }
  if (has("drywall-screw", "drywall screw")) {
    return {
      name: "Grip-Rite Drywall Screws",
      description:
        "Coarse-thread drywall screws for wood studs, fine-thread for metal studs. Phosphate coating prevents corrosion; bugle head countersinks cleanly without tearing the paper face.",
      url: "https://www.amazon.com/s?k=Grip-Rite+coarse+thread+drywall+screws&tag=buildguiders-20",
    };
  }
  if (has("drywall-tape", "drywall tape", "mesh-tape")) {
    return {
      name: "Saint-Gobain FibaFuse Paperless Drywall Tape",
      description:
        "FibaFuse is a fiberglass mesh tape that's stronger and more mold-resistant than paper tape, with no bubbling on inside corners. Preferred by pros for kitchen and bathroom repairs.",
      url: "https://www.amazon.com/s?k=Saint-Gobain+FibaFuse+paperless+drywall+tape&tag=buildguiders-20",
    };
  }
  if (has("drywall")) {
    return {
      name: "National Gypsum Hi-Impact Drywall",
      description:
        "Hi-Impact drywall has a fiberglass mat face instead of paper, making it highly resistant to mold, moisture, and physical impact. Ideal for garages, basements, and high-traffic walls.",
      url: "https://www.amazon.com/s?k=mold+resistant+drywall+panel&tag=buildguiders-20",
    };
  }

  // MULCH / LANDSCAPING
  if (has("landscape-fabric", "landscape fabric", "weed-barrier", "weed barrier")) {
    return {
      name: "Dewitt Pro 5 Weed Barrier Landscape Fabric",
      description:
        "A commercial-grade woven landscape fabric that blocks weeds while allowing water and nutrients to pass through. More durable than standard black plastic sheeting.",
      url: "https://www.amazon.com/s?k=Dewitt+Pro+5+weed+barrier+landscape+fabric&tag=buildguiders-20",
    };
  }
  if (has("rubber-mulch", "rubber mulch")) {
    return {
      name: "Rubberific Premium Shredded Rubber Mulch",
      description:
        "Lasts 10x longer than wood mulch, won't attract termites or harbor fungus, and stays in place through rain and wind. Made from recycled tires; available in several natural colors.",
      url: "https://www.amazon.com/s?k=Rubberific+shredded+rubber+mulch&tag=buildguiders-20",
    };
  }
  if (has("topsoil")) {
    return {
      name: "Miracle-Gro Raised Bed Soil",
      description:
        "A blended topsoil and compost mix that's ready to use straight from the bag. Ideal for raised beds, garden patches, and topdressing existing lawn areas.",
      url: "https://www.amazon.com/s?k=Miracle-Gro+raised+bed+soil+topsoil&tag=buildguiders-20",
    };
  }
  if (has("mulch", "landscaping", "landscape")) {
    return {
      name: "Vigoro Black Premium Shredded Hardwood Mulch",
      description:
        "Vigoro's black-dyed hardwood mulch gives garden beds a clean, consistent look and holds color through the season. Double-shredded for easy spreading and minimal blowout.",
      url: "https://www.amazon.com/s?k=Vigoro+black+hardwood+mulch+bag&tag=buildguiders-20",
    };
  }

  // CONCRETE
  if (has("post-hole", "post hole", "fence-post", "fence post") && has("concrete")) {
    return {
      name: "Quikrete Fast-Setting Concrete Mix",
      description:
        "Quikrete Fast-Setting sets firm in 20-40 minutes — ideal for fence posts, mailboxes, and basketball hoops. Pour dry into the hole, add water, no mixing required.",
      url: "https://www.amazon.com/s?k=Quikrete+Fast-Setting+Concrete+Mix+50+lb&tag=buildguiders-20",
    };
  }
  if (has("concrete-sealer", "concrete sealer", "sealing-concrete")) {
    return {
      name: "Armor AR350 Solvent-Based Acrylic Concrete Sealer",
      description:
        "A penetrating acrylic sealer that enhances the color of exposed aggregate and stamped concrete while providing a durable, UV-resistant finish. One coat coverage up to 200 sq ft/gal.",
      url: "https://www.amazon.com/s?k=Armor+AR350+concrete+sealer&tag=buildguiders-20",
    };
  }
  if (has("concrete-resurfacer", "concrete resurfacer", "resurface")) {
    return {
      name: "Quikrete Re-Cap Concrete Resurfacer",
      description:
        "Bonds to existing concrete to fill cracks and restore a smooth finish without demolition. Covers up to 100 sq ft at 1/16\" thick with one 40 lb bag.",
      url: "https://www.amazon.com/s?k=Quikrete+Re-Cap+Concrete+Resurfacer&tag=buildguiders-20",
    };
  }
  if (has("concrete")) {
    return {
      name: "Quikrete 5000 High Early Strength Concrete",
      description:
        "Quikrete 5000 gains 5,000 PSI compressive strength — suitable for footings, slabs, steps, and columns. Reaches working strength in 1 day vs 28 days for standard mix.",
      url: "https://www.amazon.com/s?k=Quikrete+5000+High+Strength+Concrete+Mix&tag=buildguiders-20",
    };
  }

  // FENCE
  if (has("vinyl-fence", "vinyl fence", "pvc-fence", "pvc fence")) {
    return {
      name: "Weatherables Vinyl Privacy Fence Panel",
      description:
        "Weatherables vinyl privacy fence panels are pre-assembled and rated for 110 mph winds. No painting, staining, or sealing required — just set posts and drop in panels.",
      url: "https://www.amazon.com/s?k=Weatherables+vinyl+privacy+fence+panel&tag=buildguiders-20",
    };
  }
  if (has("chain-link", "chain link")) {
    return {
      name: "Yardgard Chain Link Fence Fabric",
      description:
        "Galvanized chain link fencing with a 9-gauge wire for residential yards. Available in 4 ft, 5 ft, and 6 ft heights, sold by the linear foot.",
      url: "https://www.amazon.com/s?k=Yardgard+galvanized+chain+link+fence+fabric&tag=buildguiders-20",
    };
  }
  if (has("fence")) {
    return {
      name: "Weatherables Vinyl Privacy Fence Panel",
      description:
        "A maintenance-free vinyl privacy fence that installs without tools. No rotting, warping, or annual treatment needed — comes with a lifetime warranty.",
      url: "https://www.amazon.com/s?k=vinyl+privacy+fence+panel+6ft&tag=buildguiders-20",
    };
  }

  // STAIN / SEALER
  if (has("deck-stain", "deck stain", "wood-stain", "wood stain")) {
    return {
      name: "Armstrong Clark Deck Stain",
      description:
        "Consistently rated the top oil-based deck stain by independent testing. Penetrates deep into wood fibers for long-lasting protection — typically 3-4 years on horizontal surfaces.",
      url: "https://www.amazon.com/s?k=Armstrong+Clark+deck+stain&tag=buildguiders-20",
    };
  }
  if (has("fence-stain", "fence stain")) {
    return {
      name: "Cabot Australian Timber Oil",
      description:
        "Penetrating oil finish that restores and protects weathered wood fences, decks, and siding. Blends with natural wood tones and resists UV graying for up to 2 years.",
      url: "https://www.amazon.com/s?k=Cabot+Australian+Timber+Oil&tag=buildguiders-20",
    };
  }
  if (has("stain", "sealer", "sealant", "finish") && has("exterior", "outdoor", "wood")) {
    return {
      name: "Defy Extreme Wood Stain",
      description:
        "A water-based, semi-transparent stain with zinc nano-particle UV blockers. Won't peel or crack like film-forming finishes, and allows water vapor to escape from the wood.",
      url: "https://www.amazon.com/s?k=Defy+Extreme+exterior+wood+stain&tag=buildguiders-20",
    };
  }

  // Default — general home improvement
  return {
    name: "BEHR Premium Plus Interior Paint and Primer",
    description:
      "One of the best-reviewed interior paints for everyday rooms. Paint and primer in one, excellent hide, low VOC, and available in thousands of colors.",
    url: "https://www.amazon.com/s?k=Behr+Premium+Plus+Interior+Paint&tag=buildguiders-20",
  };
}

const AFFILIATE_NOTE =
  "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH — establish the facts, then write from them
//
// This replaces a spec-verification step that never ran. It was gated on
// HAS_MODEL_RE, a regex looking for a brand and product in the article TITLE —
// and the titles come from an autocomplete sweep of category queries ("best
// paint for bathroom walls"), which essentially never name a product. Measured
// against the real corpus: 0 of 31 titles matched, so the gate had never once
// opened and every article ever written by this script came out of model recall.
//
// Two further faults sat behind it, either of which would have made it useless
// if the gate had opened:
//
//   - maxOutputTokens was 350. gemini-2.5-flash is a thinking model and its
//     reasoning comes out of that same allowance — the same bug that truncated
//     two of the first three articles at 2,500. A 350-token research call
//     returns nothing.
//   - Every failure path returned null and the caller wrote the article anyway,
//     logging nothing. A run with no research looked exactly like a run with a
//     working research step, which is why this survived unnoticed.
//
// The shape now matches the job. Research the topic first, get back a brief of
// contender products with checkable specs and their sources, then write from the
// brief and nothing else. The affiliate product is known before this runs, so it
// is named to the researcher rather than inferred from the title.
//
// REQUIRE_RESEARCH=false writes from recall when research fails, which is the
// old behaviour and off by default: an article of unverified numbers is the
// thing the honesty standard in AGENTS.md exists to prevent, so the default is
// to skip the article and say so.
// ─────────────────────────────────────────────────────────────────────────────

const RESEARCH_MODEL = normalizeModelName(process.env.RESEARCH_MODEL) || MODEL;
const RESEARCH_ENABLED = process.env.RESEARCH_ENABLED !== "false";
const REQUIRE_RESEARCH = process.env.REQUIRE_RESEARCH !== "false";

// Search plus thinking is slower than a plain completion, and the old 15s was
// tight enough to be a coin toss even before the token budget is considered.
const RESEARCH_TIMEOUT_MS = Number(process.env.RESEARCH_TIMEOUT_MS) || 90_000;

// Generous for the same reason MAX_OUTPUT_TOKENS is 8000: thinking tokens are
// drawn from this, and a brief cut in half is a brief missing its last two
// products.
const RESEARCH_MAX_OUTPUT_TOKENS = Number(process.env.RESEARCH_MAX_OUTPUT_TOKENS) || 4000;

// A brief has to establish enough to write 700-900 words from. Below this it is
// a fragment, and writing from a fragment is writing from recall with extra
// steps.
const MIN_BRIEF_CHARS = 400;
const MIN_BRIEF_PRODUCTS = 2;

// The brief's format is fixed so the writer can be told to use only what is in
// it, and so parseBriefProducts can check what came back without another model
// call.
function researchPrompt(title, categorySlug, productName) {
  return (
    `Research the products a buying guide titled "${title}" would compare. ` +
    `Category: ${categorySlug}.\n\n` +
    "Search for current information. Establish 3 to 5 products that are " +
    "genuinely the contenders for this query — what buyers and independent " +
    "reviewers actually shortlist, not one brand's range.\n\n" +
    (productName
      ? `Include ${productName} among them if it is a legitimate contender. If ` +
        "it is not the right product for this topic, say so plainly in its entry " +
        "rather than omitting it.\n\n"
      : "") +
    "Return exactly this format and nothing else:\n\n" +
    "CONTEXT:\n" +
    "- 3 to 5 facts about how this choice is actually decided: the spec that " +
    "settles it, the rating scale that matters, typical coverage or quantity " +
    "per unit so a reader can size the job.\n\n" +
    "PRODUCT: <exact product name as sold>\n" +
    "SPECS:\n" +
    "- <checkable fact> (manufacturer) or (independent: <who>)\n" +
    "WRONG FOR: <who should not buy this, specifically>\n\n" +
    "Repeat PRODUCT/SPECS/WRONG FOR for each product.\n\n" +
    "Rules:\n" +
    "- Tag every number as (manufacturer) or (independent: <who>). A " +
    "manufacturer's own marketing figure is usable but must be attributed as " +
    "theirs, never stated as established fact.\n" +
    "- Omit any fact you cannot source. An incomplete brief is fine; a " +
    "confident wrong number is not. Do not fill gaps from memory.\n" +
    "- No prices — they date, and the article must not carry them.\n" +
    "- WRONG FOR is required for every product and must name a real limitation. " +
    "If a product genuinely suits everyone, it is not a product, it is a " +
    "marketing claim.\n" +
    "- Prefer a spec with a unit or a scale (AC4, 350 sq ft/gal, 24 hours) over " +
    "an adjective. Adjectives are not research."
  );
}

// Product names the brief actually established. Exported because it decides
// whether a brief is usable, and because "did research come back with anything"
// should be answerable without a network call.
export function parseBriefProducts(brief) {
  return [
    ...String(brief ?? "").matchAll(/^\s*PRODUCT:\s*(.+?)\s*$/gim),
  ]
    .map((m) => m[1].replace(/^\*+|\*+$/g, "").trim())
    .filter((name) => name.length > 2 && !/^<.*>$/.test(name));
}

// Grounding sources, for the run log. The shape of groundingMetadata has moved
// between SDK versions, so every hop is optional and an unrecognised shape
// yields an empty list rather than throwing after the research already
// succeeded.
export function extractSources(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set();
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri ?? chunk?.retrievedContext?.uri;
    const title = chunk?.web?.title ?? chunk?.retrievedContext?.title;
    if (uri || title) seen.add(title || uri);
  }
  return [...seen];
}

/**
 * Researches a topic before anything is written.
 *
 * Returns { brief, sources } or null. Null means the facts are not established,
 * which the caller treats as a reason not to write the article rather than a
 * reason to write it from memory.
 */
export async function researchTopic(client, { title, categorySlug, productName }) {
  if (!RESEARCH_ENABLED) {
    console.log("  [research] disabled — RESEARCH_ENABLED=false");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEARCH_TIMEOUT_MS);
  try {
    const response = await client.models.generateContent({
      model: RESEARCH_MODEL,
      contents: researchPrompt(title, categorySlug, productName),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
        maxOutputTokens: RESEARCH_MAX_OUTPUT_TOKENS,
        abortSignal: controller.signal,
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    // Citation markers are the search model's own footnote syntax and mean
    // nothing once the text leaves it.
    const brief = (response.text ?? "").replace(/\s*\[\^?\d+\]/g, "").trim();
    const products = parseBriefProducts(brief);

    // Say which way it came back short. The old code collapsed "too short",
    // "truncated" and "refused" into one silent null, and that is most of why
    // this went unnoticed for three runs.
    if (!brief) {
      console.warn(
        `  [research] empty response` +
          (finishReason ? ` (finishReason: ${finishReason})` : ""),
      );
      return null;
    }
    if (finishReason && finishReason !== "STOP") {
      console.warn(
        `  [research] brief did not finish (finishReason: ${finishReason}). ` +
          `Raise RESEARCH_MAX_OUTPUT_TOKENS above ${RESEARCH_MAX_OUTPUT_TOKENS}.`,
      );
      return null;
    }
    if (brief.length < MIN_BRIEF_CHARS) {
      console.warn(
        `  [research] brief is ${brief.length} chars, under ${MIN_BRIEF_CHARS} — too thin to write from.`,
      );
      return null;
    }
    if (products.length < MIN_BRIEF_PRODUCTS) {
      console.warn(
        `  [research] brief established ${products.length} product(s), need ${MIN_BRIEF_PRODUCTS}.`,
      );
      return null;
    }

    const sources = extractSources(response);
    console.log(
      `  [research] ${products.length} products: ${products.join(", ")}`,
    );
    console.log(
      sources.length > 0
        ? `  [research] ${sources.length} source(s): ${sources.slice(0, 4).join("; ")}`
        : "  [research] no grounding sources reported — the search tool may not " +
          "have been used, so treat the brief as recall.",
    );
    return { brief, sources, products };
  } catch (err) {
    if (err.name === "AbortError" || /abort/i.test(err.message || "")) {
      console.warn(
        `  [research] timed out after ${RESEARCH_TIMEOUT_MS / 1000}s`,
      );
      return null;
    }
    // A depleted quota has to reach the caller: it applies to every remaining
    // article and the run should stop, not skip 20 articles one at a time.
    if (isFatalApiError(err.message)) throw err;
    console.warn(`  [research] failed: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function researchIsRequired() {
  return REQUIRE_RESEARCH;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELEVANCE FILTERING — keep only home improvement topics
// ─────────────────────────────────────────────────────────────────────────────

const HOME_IMPROVEMENT_KEYWORDS = [
  "paint", "primer", "stain", "sealer", "varnish", "lacquer", "finish",
  "flooring", "hardwood", "vinyl", "laminate", "lvp", "carpet", "tile",
  "grout", "mortar", "thinset", "adhesive",
  "deck", "decking", "composite", "pressure treated", "wood",
  "drywall", "sheetrock", "gypsum", "joint compound", "mud",
  "mulch", "topsoil", "landscape", "edging", "garden",
  "concrete", "cement", "mortar", "quikrete", "sakrete",
  "fence", "picket", "privacy", "railing", "post",
  "square foot", "coverage", "gallon", "bag", "yard",
  "interior", "exterior", "indoor", "outdoor",
  "bathroom", "kitchen", "bedroom", "garage", "basement",
  "waterproof", "mold", "mildew", "moisture", "humidity",
  "install", "application", "coat", "layer",
  "brands", "best", "vs", "review", "comparison",
];

function isHomeImprovementRelevant(title) {
  const lower = title.toLowerCase();
  return HOME_IMPROVEMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY INFERENCE — map topics to the 14 calculator categories
//
// Order is load-bearing. The narrow tests run before the broad ones they would
// otherwise be swallowed by: "pool deck" is a pool topic, not a deck one, and a
// raised bed is a garden topic, not general landscaping.
// ─────────────────────────────────────────────────────────────────────────────

export function inferCategoryFromTopic(slug, title) {
  // Slugs are hyphenated and autocomplete suggestions are spaced. Normalising to
  // spaces lets one set of patterns match both, instead of quietly failing on
  // slug-only input and defaulting everything to paint.
  const t = (slug + " " + title).toLowerCase().replace(/-/g, " ");

  // Every short token is anchored with \b. Without it "waterproof" contains
  // "roof", so "best waterproof laminate flooring for pets" was categorised as
  // roofing and rendered a Free Roof Calculator button — and "waterproof" is one
  // of the INTENTS seeds, so it recurs across flooring, paint and deck stain.
  // The same trap sits in "versatile" (tile) and "sustainable" (stain).
  // \broof still matches roof, roofs and roofing; it just will not match inside
  // another word.

  // Narrow first
  if (/\bpool\b|chlorine|pool shock|pool pump|pool filter|pool cover/.test(t)) return "pool";
  if (/wallpaper|peel.and.stick|wall covering/.test(t)) return "wallpaper";
  if (/raised (garden )?bed|garden soil|raised bed soil|potting mix|\bcompost|\bperlite/.test(t)) return "garden";
  if (/grass seed|\blawn|\bsod\b|overseed|starter fertilizer|straw mat/.test(t)) return "lawn";
  if (/\broof|\bshingle|drip edge|ridge vent|\bsoffit|\bflashing/.test(t)) return "roofing";
  if (/\bstain|\bsealer|\bsealant|exterior finish/.test(t)) return "stain-sealer";

  // Broad
  if (/\bpaint|\bprimer/.test(t)) return "paint";
  if (/\bfloor|hardwood|vinyl plank|\blvp\b|laminate|\bcarpet|underlayment/.test(t)) return "flooring";
  if (/\btile|\bgrout|thinset|\bmortar|backsplash/.test(t)) return "tile";
  if (/\bdeck|composite|pressure.treated|\brailing/.test(t)) return "deck";
  if (/drywall|sheetrock|joint compound|gypsum/.test(t)) return "drywall";
  if (/\bmulch|topsoil|landscape|\bedging|weed barrier/.test(t)) return "landscaping";
  if (/concrete|cement|quikrete|sakrete|post hole|\bslab|\bfooting/.test(t)) return "concrete";
  if (/\bfence|\bfencing|\bpicket|chain link/.test(t)) return "fence";

  return "paint"; // default
}

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY SLUG DEDUPLICATION — Jaccard similarity on word sets
// ─────────────────────────────────────────────────────────────────────────────

function slugsAreSimilar(slugA, slugB, threshold = 0.85) {
  const wordsA = new Set(slugA.split("-"));
  const wordsB = new Set(slugB.split("-"));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 && intersection.size / union.size >= threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// TITLE CASING
// ─────────────────────────────────────────────────────────────────────────────

const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
  "in", "on", "at", "to", "by", "of", "up", "as", "is", "if",
  "vs", "with", "from", "not",
]);

const UPPER_WORDS = new Set([
  "lvp", "pvc", "hdr", "uv", "voc", "psi", "acq", "ptdf",
]);

const BRAND_CASING = {
  "behr": "BEHR",
  "trex": "Trex",
  "timbertech": "TimberTech",
  "fiberon": "Fiberon",
  "mapei": "Mapei",
  "quikrete": "Quikrete",
  "sakrete": "Sakrete",
  "pergo": "Pergo",
  "lifeproof": "LifeProof",
  "mohawk": "Mohawk",
  "armstrong": "Armstrong",
  "cabot": "Cabot",
  "zinsser": "Zinsser",
  "sherwin-williams": "Sherwin-Williams",
  "sherwin williams": "Sherwin-Williams",
  "benjamin moore": "Benjamin Moore",
  "bruce": "Bruce",
  "daltile": "Daltile",
  "schluter": "Schluter",
  "usg": "USG",
  "dewitt": "Dewitt",
  "rubberific": "Rubberific",
  "vigoro": "Vigoro",
  "miracle-gro": "Miracle-Gro",
  "miracle gro": "Miracle-Gro",
  "grip-rite": "Grip-Rite",
  "grip rite": "Grip-Rite",
  "yardgard": "Yardgard",
  "weatherables": "Weatherables",
  "fortress": "Fortress",
  "roberts": "Roberts",
  "defy": "Defy",
};

function titleCase(str) {
  let result = str;
  for (const [lower, proper] of Object.entries(BRAND_CASING)) {
    const regex = new RegExp(
      `\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    result = result.replace(regex, proper);
  }

  return result
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();

      // Already handled by brand casing
      for (const proper of Object.values(BRAND_CASING)) {
        if (word === proper || word === proper.split(" ")[0]) return word;
      }

      // Uppercase acronyms
      if (UPPER_WORDS.has(lower)) return word.toUpperCase();

      // Minor words (not first word)
      if (i > 0 && MINOR_WORDS.has(lower)) return lower;

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Google truncates past ~60 characters, so anything beyond it is never shown
// (AGENTS.md §9). Counted in code points: an em dash is one character on screen
// and three bytes in the file, so a byte count would cut real words off.
const MAX_TITLE_CHARS = 60;

export function capTitle(rawTitle, suffix) {
  const full = rawTitle + suffix;
  if ([...full].length <= MAX_TITLE_CHARS) return full;

  // The head term earns its place before the suffix does. Drop the suffix and
  // keep the term whole if that fits.
  if ([...rawTitle].length <= MAX_TITLE_CHARS) return rawTitle;

  // Still long: trim on a word boundary rather than mid-word.
  const chars = [...rawTitle];
  let trimmed = chars.slice(0, MAX_TITLE_CHARS).join("");
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace > MAX_TITLE_CHARS * 0.6) trimmed = trimmed.slice(0, lastSpace);
  return trimmed.trimEnd().replace(/[\s—–-]+$/, "");
}

function getTitleSuffix(title) {
  const lower = title.toLowerCase();
  if (lower.startsWith("best ")) return " in 2026";
  if (lower.includes(" vs ")) return " — Which Should You Buy?";
  if (lower.includes("how to choose")) return " — Buyer's Guide";
  if (lower.includes("how much") || lower.includes("how many")) return " — Coverage Calculator Guide";
  if (lower.includes("types of")) return " — Complete Guide";
  if (lower.includes("review")) return " — Is It Worth It?";
  if (lower.includes("comparison")) return " — Side-by-Side";
  return " — Complete Buying Guide";
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION & KEYWORD GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateDescription(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandName = brand ? `${brand} ` : "";

  if (lower.startsWith("best ")) {
    const subject = title.replace(/^best /i, "").replace(/ in \d{4}$/i, "");
    return `The best ${subject.toLowerCase()} researched and compared for 2026 — honest pros, cons, and what each one is actually for.`;
  }
  if (lower.includes(" vs ")) {
    return `${title.replace(/—.*$/, "").trim()} — a side-by-side comparison of coverage, durability, price, and ease of application to help you pick the right one.`;
  }
  if (lower.includes("how to choose") || lower.includes("how to pick")) {
    const subject = lower.replace("how to choose", "").replace("how to pick", "").trim();
    return `Everything you need to know to choose the right ${subject} for your project — coverage, finish types, brand differences, and what to avoid.`;
  }
  if (lower.includes("coverage") || lower.includes("how much") || lower.includes("how many")) {
    return `Find out exactly ${lower.includes("how much") ? "how much" : "how many"} ${brandName}you need for your project — with waste factor, coat count, and a link to our free calculator.`;
  }
  if (lower.includes("types of")) {
    const subject = title.replace(/types of /i, "").replace(/—.*$/, "").trim();
    return `A complete breakdown of ${subject.toLowerCase()} types — what each is best for, how they compare in durability and cost, and how to pick the right one.`;
  }
  return `${title.replace(/—.*$/, "").trim()} — researched picks, honest trade-offs, and how to choose between them.`;
}

function generateKeywords(title, slug, brand) {
  const lower = title.toLowerCase();
  const brandLower = (brand || "").toLowerCase();
  const slugPhrase = slug.replace(/-/g, " ");
  const keywords = [slugPhrase];

  if (lower.startsWith("best ")) {
    keywords.push(`top ${slugPhrase.replace("best ", "")}`);
    keywords.push(`${slugPhrase} 2026`);
    keywords.push(`${brandLower} ${slugPhrase.replace("best ", "")}`.trim());
  } else if (lower.includes(" vs ")) {
    keywords.push(slugPhrase);
    keywords.push(`${slugPhrase} comparison`);
  } else if (lower.includes("how to choose") || lower.includes("how many") || lower.includes("how much")) {
    keywords.push(`${slugPhrase} guide`);
    keywords.push(`${brandLower} coverage calculator`.trim());
  } else {
    keywords.push(`${brandLower} ${slugPhrase}`.trim());
    keywords.push(`buy ${slugPhrase}`);
  }

  const unique = [...new Set(keywords.filter((k) => k.trim().length > 3))];
  return unique.slice(0, 5).join(", ");
}

// ─────────────────────────────────────────────────────────────────────────────
// SLUGIFY
// ─────────────────────────────────────────────────────────────────────────────

const slugify = (s) => {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Quick self-test
(function validateSlugify() {
  const cases = [
    ["best interior paint for bathrooms", "best-interior-paint-for-bathrooms"],
    ["vinyl plank flooring vs laminate", "vinyl-plank-flooring-vs-laminate"],
    ["how to choose deck stain", "how-to-choose-deck-stain"],
    ["best composite decking brands", "best-composite-decking-brands"],
    ["concrete sealer types", "concrete-sealer-types"],
  ];
  for (const [input, expected] of cases) {
    const got = slugify(input);
    if (got !== expected) {
      throw new Error(
        `slugify broken: "${input}" → "${got}" (expected "${expected}")`,
      );
    }
  }
})();

const truncate = (s, max = 155) =>
  s.length > max ? s.slice(0, max - 1).trim() + "..." : s;

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING SLUG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getExistingSlugs() {
  if (!fs.existsSync(ARTICLES_DIR)) return new Set();
  return new Set(
    fs
      .readdirSync(ARTICLES_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(".mdx", "")),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────

async function getAutocompleteSuggestions(query) {
  try {
    const url =
      "http://suggestqueries.google.com/complete/search?client=chrome&q=" +
      encodeURIComponent(query);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scoreQuery(query) {
  const q = query.toLowerCase();
  if (IGNORE_TERMS.some((t) => q.includes(t))) return 0;
  if (!HIGH_INTENT.some((t) => q.includes(t))) return 0;
  let score = 10;
  if (q.includes("best") || q.startsWith("best ")) score += 10;
  if (q.includes(" vs ")) score += 8;
  if (q.includes("review") || q.includes("comparison")) score += 6;
  if (q.includes("waterproof") || q.includes("mold resistant")) score += 5;
  if (q.includes("for bathroom") || q.includes("for kitchen")) score += 5;
  if (q.includes("coverage") || q.includes("per gallon") || q.includes("per square foot")) score += 5;
  if (q.includes("how to choose") || q.includes("how to pick")) score += 4;
  if (q.includes("types of") || q.includes("brands")) score += 4;
  if (q.includes("durable") || q.includes("rated")) score += 3;
  if (q.includes("for pets") || q.includes("for outdoor")) score += 3;
  const wc = q.split(/\s+/).length;
  if (wc >= 5) score += 3;
  if (wc >= 7) score += 2;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER IMAGE
// ─────────────────────────────────────────────────────────────────────────────

const COVER_BY_CATEGORY = {
  paint: "/images/covers/Cover-Paint.png",
  flooring: "/images/covers/Cover-Flooring.png",
  tile: "/images/covers/Cover-Tile.png",
  deck: "/images/covers/Cover-Deck.png",
  drywall: "/images/covers/Cover-Drywall.png",
  landscaping: "/images/covers/Cover-Landscaping.png",
  concrete: "/images/covers/Cover-Concrete.png",
  fence: "/images/covers/Cover-Fence.png",
  "stain-sealer": "/images/covers/Cover-Stain.png",
  roofing: "/images/covers/Cover-Roof.png",
  lawn: "/images/covers/Cover-Lawn.png",
  garden: "/images/covers/Cover-Garden.png",
  pool: "/images/covers/Cover-Pool.png",
  wallpaper: "/images/covers/Cover-Wallpaper.png",
  default: "/images/covers/Cover-General.png",
};

// Fallback that is known to exist. Article schema needs a resolvable image or
// Google rejects the rich result, and nothing flags a broken one because the
// path appears only in JSON-LD and OG tags, never as an <img> (AGENTS.md §10).
const FALLBACK_COVER = "/og-default.png";

const warnedCovers = new Set();

function existsInPublic(webPath) {
  return fs.existsSync(path.join(ROOT, "public", webPath.replace(/^\//, "")));
}

// ---------------------------------------------------------------------------
// Style exemplar
//
// Every writing rule in the system prompt is a prohibition, and prohibitions
// only tell the model what to stop doing. It stops, and what is left is prose
// with no tells and no voice — which is what the first three generated articles
// were. They passed every gate and still read like a spec sheet apologising.
//
// So show it the target instead. These are real paragraphs from the
// hand-written corpus, read off disk rather than pasted here, so the exemplar
// cannot drift away from the articles it is supposed to sound like — edit the
// guides and the exemplar follows.
//
// Two excerpts: the opening, which sets how an article enters a subject, and a
// product section, which is where the generated drafts went flattest.
const EXEMPLAR_SLUGS = ["best-interior-paint", "best-solid-deck-stain"];
const EXEMPLAR_MAX_CHARS = 1400;

// First prose paragraphs after the frontmatter, then the first H2 section.
// Skips headings and list items: the shape being demonstrated is the sentences.
function excerptFrom(body) {
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const opening = blocks.filter((b) => !b.startsWith("#") && !/^[*\-\d]/.test(b)).slice(0, 2);

  const h2 = blocks.findIndex((b) => /^##\s/.test(b));
  const section =
    h2 === -1
      ? []
      : [blocks[h2], ...blocks.slice(h2 + 1, h2 + 3).filter((b) => !b.startsWith("#"))];

  const joined = [...opening, ...section].join("\n\n");
  if (joined.length <= EXEMPLAR_MAX_CHARS) return joined;

  // Cut at the last sentence end rather than mid-word. An exemplar that stops
  // in the middle of a clause is a demonstration of stopping mid-clause, and
  // truncation is the one failure this generator already has form for.
  const clipped = joined.slice(0, EXEMPLAR_MAX_CHARS);
  const lastStop = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf(".\n"),
    clipped.lastIndexOf("? "),
    clipped.lastIndexOf("! "),
  );
  return lastStop > 0 ? clipped.slice(0, lastStop + 1) : clipped;
}

// Returns "" when the corpus is unreadable rather than throwing. A missing
// exemplar makes the prose worse; it should not stop the run, and the gates
// still hold either way.
export function loadStyleExemplar(slugs = EXEMPLAR_SLUGS) {
  const parts = [];
  for (const slug of slugs) {
    try {
      const raw = fs.readFileSync(
        path.join(ROOT, "content", "articles", `${slug}.mdx`),
        "utf8",
      );
      const body = raw.split(/^---$/m).slice(2).join("---").trim();
      const excerpt = excerptFrom(body);
      if (excerpt) parts.push(excerpt);
    } catch {
      // Exemplar is a nicety, not a dependency.
    }
  }
  return parts.join("\n\n---\n\n");
}

// Resolves the mapped cover against public/ and falls back when it is missing,
// so the generator cannot mint another article whose schema image 404s. Every
// article on the site currently points at a covers directory that was never
// committed; this stops the count from growing while that is sorted out.
export function getCoverImage(categorySlug) {
  const mapped = COVER_BY_CATEGORY[categorySlug] || COVER_BY_CATEGORY.default;
  if (existsInPublic(mapped)) return mapped;

  if (!existsInPublic(FALLBACK_COVER)) {
    throw new Error(
      `Cover ${mapped} is missing from public/ and so is the fallback ` +
        `${FALLBACK_COVER}. Every generated article would carry an unresolvable ` +
        "schema image. Commit a cover asset before generating.",
    );
  }
  if (!warnedCovers.has(mapped)) {
    warnedCovers.add(mapped);
    console.warn(`  cover ${mapped} not in public/ — using ${FALLBACK_COVER}`);
  }
  return FALLBACK_COVER;
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONTMATTER — clean output, published: true
// ─────────────────────────────────────────────────────────────────────────────

function buildFrontmatter(slug, title, brand, categorySlug, coverImage, product) {
  const date = new Date().toISOString().slice(0, 10);
  const description = truncate(generateDescription(title, slug, brand));
  const keywords = generateKeywords(title, slug, brand);
  const coverAlt = (brand ? brand + " " : "") + title.replace(/ — .*$/, "") + " — buying guide";

  // Wrap description at ~80 chars for YAML readability
  const prodDesc = product.description.length > 80
    ? product.description.slice(0, 77).trimEnd() + "..."
    : product.description;

  return (
    "---\n" +
    "slug: " + slug + "\n" +
    "title: '" + title.replace(/'/g, "''") + "'\n" +
    (brand ? "brand: " + brand + "\n" : "") +
    "category: " + categorySlug + "\n" +
    "coverImage: " + coverImage + "\n" +
    "coverAlt: '" + coverAlt.replace(/'/g, "''") + "'\n" +
    "description: >-\n  " + description + "\n" +
    "keywords: '" + keywords + "'\n" +
    "date: '" + date + "'\n" +
    "published: true\n" +
    "tags: []\n" +
    "products:\n" +
    "  - name: " + product.name + "\n" +
    "    description: >-\n" +
    "      " + prodDesc + "\n" +
    "    url: '" + product.url + "'\n" +
    "    note: '" + AFFILIATE_NOTE + "'\n" +
    "---\n\n"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE BODY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generateArticleBody(
  client,
  title,
  brand,
  categorySlug,
  existingSlugs,
  product,
  research = null,
) {
  const calculatorPath = calculatorFor(categorySlug);
  const calculatorName = calculatorLabel(calculatorPath);

  const system =
    "You are a home improvement writer producing buying guides for BuildGuiders.com.\n\n" +
    "HONESTY — these are absolute, and a draft that breaks one is unusable:\n" +
    "- You have NOT used, tested, installed, or handled any product. Never write " +
    "\"I tested\", \"I've used\", \"the one I reach for\", \"in my experience\", or any " +
    "other claim of first-hand use. Google's reviews systems detect fabricated " +
    "first-hand experience, so this is a ranking risk as well as a trust one.\n" +
    "- Write in second person (\"you\") or impersonally (\"the pick for X\", \"the " +
    "go-to when...\"). Frame picks as researched and compared, never as tested by us.\n" +
    "- Ground claims in manufacturer specs, independent or professional reviews, and " +
    "verified buyer feedback — and only claim those sources.\n" +
    "- NEVER invent coverage rates, drying times, prices, star ratings, or specs. " +
    "Use a real number or omit it. No \"we measured\" figures of any kind.\n" +
    "- Attribute a manufacturer's own marketing number to the manufacturer rather " +
    "than stating it as fact.\n\n" +
    "WRITING — a draft that reads as machine-written is unusable, and these are\n" +
    "the specific habits that make it read that way:\n" +
    "- NEVER use bold field labels inside a section. No \"**Best for:**\", \"**Key " +
    "Features:**\", \"**Caveat:**\", \"**Pros:**\" or any similar label. Write the " +
    "same information as connected prose. A run of identically-shaped labelled " +
    "blocks is the single most recognisable tell there is.\n" +
    "- Do not open a section by asserting that the subject matters. \"Choosing the " +
    "right paint is crucial because...\" tells the reader nothing they did not " +
    "know when they searched. Open with the first real decision, or a fact.\n" +
    "- Avoid these words: crucial, essential, vital, key (as an adjective), " +
    "comprehensive, robust, seamless, versatile, unique, ideal, optimal, ensure, " +
    "boasts, delve, showcase, underscore, elevate, leverage, plays a significant " +
    "role, when it comes to. Test: if deleting the word leaves the sentence " +
    "intact, it was decoration.\n" +
    "- Write \"is\" and \"has\". Not \"serves as\", \"functions as\", \"boasts\", " +
    "\"features\", \"provides\".\n" +
    "- Do not close a sentence with a floating -ing clause restating significance " +
    "(\"...making it ideal for bathrooms\", \"...ensuring lasting durability\"). " +
    "Stop at the fact.\n" +
    "- A checkable detail beats an adjective. \"AC4 rating\" beats \"highly " +
    "durable\"; \"three-sided cap\" beats \"excellent protection\". Where you have " +
    "no real figure, write the plain sentence instead of reaching for a " +
    "superlative.\n" +
    "- Vary sentence and paragraph length. Four paragraphs of the same shape read " +
    "as generated whatever the words are.\n" +
    "- Say plainly who each product is WRONG for. A guide where everything suits " +
    "somebody is useless to the person deciding.\n" +
    "- Commit in the Bottom Line: name one product and say who should buy it. " +
    "Hedging across every option is not balance.\n" +
    "- Open the article inside the reader's situation, not on the subject in the " +
    "abstract. They already have the problem; start where they are standing.\n" +
    "- Put a real quantity in the first two paragraphs — coverage per gallon, a " +
    "rating, a square-foot figure — so the reader can size the job before they " +
    "read the picks.\n" +
    "- State consequences, not qualities. \"Skip it and any solid stain will flake " +
    "by next summer\" earns its place; \"proper preparation is important\" does " +
    "not.\n" +
    "- Contractions are fine and preferred. Short sentences are fine. A one-line " +
    "paragraph for the blunt version is fine.\n\n" +
    "Every article must:\n" +
    "1. Be a buying guide, not a how-to install guide\n" +
    "2. Help readers choose between products before they buy\n" +
    "3. Close by linking the reader to " + calculatorName + " as a MARKDOWN LINK " +
    "to " + calculatorPath + ". Write it exactly like this, brackets and " +
    "parentheses included: \"Run your measurements through our free [" +
    calculatorName.toLowerCase() + "](" + calculatorPath + ") to get an exact " +
    "shopping list before you order.\" A plain-text mention is a dead cross-link " +
    "and fails the quality gate. Use that exact path. If the topic does not fit " +
    "that calculator, link " + CALCULATOR_HUB + " instead. Do not invent any " +
    "other calculator path.\n" +
    "4. Include honest pros and cons — no fluff\n" +
    "5. Use plain, direct language, the way a knowledgeable person at a trade counter " +
    "would talk\n" +
    "6. Be 700-900 words, no padding\n\n" +
    "Structure every article with these H2 sections:\n" +
    "- \"What to Look for in [Product]\" (2-3 paragraphs on key decision factors)\n" +
    "- One H2 per top product recommendation. Cover who it suits, the specs that " +
    "actually decide it, and an honest caveat — as flowing sentences, NEVER as " +
    "labelled fields.\n" +
    "- \"What to Skip\" (1 paragraph — warn about common bad choices)\n" +
    "- \"Bottom Line\" (1 paragraph — direct recommendation, link to the calculator)\n\n" +
    "Start at H2. The title is rendered from frontmatter as the page's only H1, so " +
    "an H1 in the body would give the page two (AGENTS.md §11).\n\n" +
    "NEVER write installation tutorials.";

  // The rules above are all prohibitions, and a model that obeys every "do not"
  // produces prose with no tells and no voice — which is what the first three
  // generated articles were. They cleared every gate and still read like a spec
  // sheet. Showing the target is the part that was missing.
  const exemplar = loadStyleExemplar();
  const systemWithVoice = exemplar
    ? system +
      "\n\nHOUSE VOICE — these are real excerpts from BuildGuiders articles. " +
      "Match their register, sentence rhythm and directness. Do NOT reuse their " +
      "wording, products or facts; they are a demonstration of how to write, not " +
      "material to draw on.\n\n" +
      exemplar
    : system;

  const relatedSlugs = Array.from(existingSlugs)
    .filter(
      (s) =>
        s.includes(categorySlug.split("-")[0]) ||
        (brand && s.includes(brand.toLowerCase().replace(/\s+/g, "-"))),
    )
    .slice(0, 3);
  const relatedLinksHint =
    relatedSlugs.length > 0
      ? "\n\nFor the related guides section use ONLY these real internal links:\n" +
        relatedSlugs
          .map((s) => "- [" + s.replace(/-/g, " ") + "](/guides/" + s + ")")
          .join("\n")
      : "";

  // Two shapes, and the difference is what the model is allowed to know. With a
  // brief it writes from the brief and may not reach past it; without one it is
  // writing from recall, which only happens when REQUIRE_RESEARCH is explicitly
  // switched off.
  const common =
    "\n\nWrite an MDX article body (NO frontmatter, NO H1 heading — the title " +
    "is rendered separately from frontmatter). Start directly with the first H2 " +
    "section.\n\n" +
    "Rules:\n" +
    "- Insert exactly one affiliate link: [" + product.name + " (paid link)](" +
    product.url + ") placed where it helps the reader most.\n" +
    "- No prices, ratings, or time-sensitive claims.\n" +
    "- Minimum 700 words of substantive content.";

  const userPrompt = research
    ? "Write a buying guide article from the research brief below. The brief is " +
      "the only source you may use.\n\n" +
      "=== RESEARCH BRIEF ===\n" + research.brief + "\n=== END BRIEF ===\n\n" +
      `Title: ${title}\nBrand: ${brand || "various"}\nCategory: ${categorySlug}` +
      common +
      "\n- Cover the products the brief establishes, one H2 each. Do NOT introduce " +
      "a product the brief does not name, and do NOT add a spec, figure or " +
      "warranty term that is not in it. If the brief is thin on a product, write " +
      "less about that product — do not fill the gap from memory. Every number in " +
      "this article has been checked and yours have not.\n" +
      "- The brief tags each fact (manufacturer) or (independent: who). Carry that " +
      "distinction into the prose: attribute a manufacturer's figure to the " +
      "manufacturer (\"Pergo rates it for 24 hours\"), and state an independent " +
      "one plainly. Never print the tags themselves.\n" +
      "- Use each product's WRONG FOR line. That judgement is the most useful " +
      "sentence in the section and the easiest one to soften into uselessness.\n" +
      "- Use the CONTEXT facts in the opening section so the reader can size the " +
      "job before the picks start." +
      relatedLinksHint
    : `Write a buying guide article.\n\nTitle: ${title}\nBrand: ${brand || "various"}\nCategory: ${categorySlug}` +
      common +
      "\n- You have no research brief for this topic. Write only what you are " +
      "confident is true, and omit a number rather than estimating it." +
      relatedLinksHint;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemWithVoice,
      temperature: 0.4,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  const content = response.text;

  // A truncated article is worse than no article: it reads as finished until
  // someone reaches the end, and it still clears a word-count gate. Discard it
  // and let the batch move on rather than writing half a guide to disk.
  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      "Gemini hit the " + MAX_OUTPUT_TOKENS + "-token output cap on: " + title +
        ". The article would stop mid-sentence, so it is discarded. Raise " +
        "MAX_OUTPUT_TOKENS if this recurs.",
    );
  }

  if (!content) {
    // An empty body is usually a safety block, not a network failure, so say
    // which rather than leaving a bare "no content".
    throw new Error(
      "Gemini returned no content for: " + title +
        (finishReason ? ` (finishReason: ${finishReason})` : ""),
    );
  }
  return content.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// FATAL vs PER-ARTICLE ERRORS
//
// A depleted quota, a rejected key or a bad model name fails identically on
// every remaining article. The first run of this workflow burned twenty calls
// on the same "prepayment credits are depleted" response and still exited 0,
// so the run went green with nothing written. Stop on the first of these and
// report it, rather than restating it twenty times.
// ─────────────────────────────────────────────────────────────────────────────

const FATAL_ERROR_RE =
  /RESOURCE_EXHAUSTED|PERMISSION_DENIED|UNAUTHENTICATED|quota|credits? (are )?depleted|billing|API key not valid|\b(401|403|429)\b|NOT_FOUND.*model|model.*not found/i;

export function isFatalApiError(message) {
  return FATAL_ERROR_RE.test(String(message ?? ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC CACHE
//
// The autocomplete sweep is 2,175 seed pairs at 150ms, so roughly five and a
// half minutes of deliberate delay before a single word is written — and it
// re-researches the whole catalogue on every run to pick three topics. Cached,
// one sweep feeds many runs: later runs take the next unused candidates.
//
// The cache stores candidates, never articles. Slugs that exist by the time it
// is read are filtered out at ranking, so a stale cache can go out of date but
// cannot cause a duplicate.
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_CACHE_PATH = path.join(ROOT, ".topic-cache.json");
const TOPIC_CACHE_MAX_AGE_HOURS =
  Number(process.env.TOPIC_CACHE_MAX_AGE_HOURS) || 168; // one week
const TOPIC_CACHE_ENABLED = process.env.TOPIC_CACHE !== "off";

export function isCacheFresh(writtenAt, now = Date.now(), maxAgeHours = TOPIC_CACHE_MAX_AGE_HOURS) {
  if (!writtenAt) return false;
  const age = now - new Date(writtenAt).getTime();
  if (!Number.isFinite(age) || age < 0) return false;
  return age < maxAgeHours * 3600 * 1000;
}

function loadTopicCache() {
  if (!TOPIC_CACHE_ENABLED) return null;
  if (!fs.existsSync(TOPIC_CACHE_PATH)) return null;
  try {
    const cache = JSON.parse(fs.readFileSync(TOPIC_CACHE_PATH, "utf8"));
    if (!Array.isArray(cache.candidates) || cache.candidates.length === 0) return null;
    if (!isCacheFresh(cache.writtenAt)) {
      console.log("Topic cache is older than " + TOPIC_CACHE_MAX_AGE_HOURS + "h — re-researching.");
      return null;
    }
    return cache;
  } catch (err) {
    // A corrupt cache must never stop a run; the sweep is the fallback.
    console.warn("Topic cache unreadable (" + err.message + ") — re-researching.");
    return null;
  }
}

function saveTopicCache(scored) {
  if (!TOPIC_CACHE_ENABLED) return;
  try {
    fs.writeFileSync(
      TOPIC_CACHE_PATH,
      JSON.stringify(
        { writtenAt: new Date().toISOString(), candidates: [...scored.entries()] },
        null,
        2,
      ),
      "utf8",
    );
    console.log("Cached " + scored.size + " candidate topics for later runs.");
  } catch (err) {
    console.warn("Could not write the topic cache (" + err.message + ") — continuing.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN OUTCOME
//
// A run that wrote nothing because the API refused every call is a failure, not
// a quiet no-op. Run 34794137890 wrote nothing, exited 0, and the workflow
// reported "Every candidate topic already exists" — a cause it had no way to
// know. Partial success stays green: one article failing out of three is worth
// reporting, not worth failing the run over, and the quality gates still judge
// whatever landed.
// ─────────────────────────────────────────────────────────────────────────────

export function describeOutcome({ created, failed, unresearched = 0, fatal }) {
  if (created === 0 && failed > 0) {
    return {
      ok: false,
      message:
        "Nothing was written. " +
        (fatal
          ? "The API rejected the request: " + fatal
          : "Every article failed; the errors are above."),
    };
  }
  // Skipping for want of research is the correct behaviour on one topic and a
  // broken research step on all of them. Either way it must not read as a clean
  // run: a workflow that quietly writes nothing every week is the failure this
  // function was extracted to prevent in the first place.
  if (created === 0 && unresearched > 0) {
    return {
      ok: false,
      message:
        `Nothing was written: research came back unusable for all ${unresearched} ` +
        "topic(s), so none were written from unverified numbers. The [research] " +
        "lines above say how each one came back short — an empty response or a " +
        "finishReason other than STOP points at the token budget, a timeout at " +
        "RESEARCH_TIMEOUT_MS.",
    };
  }
  return {
    ok: true,
    message:
      `Wrote ${created} article(s), ${failed} failed` +
      (unresearched > 0 ? `, ${unresearched} skipped for want of research` : "") +
      ".",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION LOOP
//
// Extracted from main() so the failure path can be exercised directly. The bug
// this guards against — every call failing while the run still reported success
// — was invisible precisely because this logic sat inline in main() behind eight
// minutes of network research that no test could reach.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBatch(client, ranked, existingSlugs) {
  let created = 0;
  let failed = 0;
  let unresearched = 0;
  let fatal = null;

  for (const [slug, { title, brand, categorySlug, coverImage }] of ranked) {
    const filePath = path.join(ARTICLES_DIR, slug + ".mdx");
    if (fs.existsSync(filePath)) {
      console.log("Skipping: " + slug);
      continue;
    }
    try {
      console.log("Generating: " + title);
      const product = pickProductForTopic(slug, categorySlug);

      // Research first. The product is picked above so the researcher can be
      // told which one the article has to place, rather than guessing from the
      // title — which is what the old gate tried to do and never managed.
      const research = await researchTopic(client, {
        title,
        categorySlug,
        productName: product.name,
      });

      if (!research && researchIsRequired()) {
        unresearched++;
        console.log(
          "Skipping: " + slug + " — the facts are not established, and an " +
            "article of unverified numbers is worse than no article. Set " +
            "REQUIRE_RESEARCH=false to write it from recall anyway.\n",
        );
        continue;
      }

      const body = await generateArticleBody(
        client,
        title,
        brand,
        categorySlug,
        existingSlugs,
        product,
        research,
      );
      const fm = buildFrontmatter(slug, title, brand, categorySlug, coverImage, product);
      fs.writeFileSync(filePath, fm + body + "\n", "utf8");
      existingSlugs.add(slug); // prevent dupes within this run
      created++;
      console.log("Created: " + slug + ".mdx\n");
    } catch (err) {
      failed++;
      console.error("Failed: " + slug + " — " + err.message);
      if (isFatalApiError(err.message)) {
        fatal = err.message;
        console.error(
          "\nThis error applies to every remaining article, so the run is stopping " +
            "here rather than repeating it " + (ranked.length - created - failed) +
            " more time(s).",
        );
        break;
      }
    }
  }

  return { created, failed, unresearched, fatal };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // Config before credentials: a broken calculator map is worth reporting whether
  // or not a key happens to be set, and this costs nothing to check.
  const calculators = loadCalculators();
  validateCalculatorMap(calculators);
  console.log(
    "Cross-linking " + calculators.length + " calculators from lib/calculators.ts.",
  );

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  // Imported here rather than at module scope so the pure helpers above can be
  // imported and tested without these packages present.
  await import("dotenv/config");
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const existingSlugs = getExistingSlugs();
  console.log(
    "Found " + existingSlugs.size + " existing articles — skipping those.\n",
  );
  const cached = loadTopicCache();
  const scored = new Map(cached ? cached.candidates : []);

  if (cached) {
    console.log(
      "Using " + scored.size + " cached candidate topics from " +
        cached.writtenAt + " (TOPIC_CACHE=off to force a fresh sweep).\n",
    );
  } else {
    console.log("Researching topics via Google Autocomplete...\n");
  }

  let filteredOffTopic = 0;
  let filteredFuzzyDupe = 0;

  for (const category of cached ? [] : CATEGORIES) {
    for (const intent of INTENTS) {
      const suggestions = await getAutocompleteSuggestions(
        category + " " + intent,
      );
      for (const suggestion of suggestions) {
        const score = scoreQuery(suggestion);
        if (score === 0) continue;

        // Relevance check — skip non-home-improvement topics
        if (!isHomeImprovementRelevant(suggestion)) {
          filteredOffTopic++;
          continue;
        }

        const slug = slugify(suggestion);
        if (!slug || existingSlugs.has(slug)) continue;

        // Fuzzy dedup against existing articles
        const isFuzzyDupeExisting = [...existingSlugs].some((existing) =>
          slugsAreSimilar(slug, existing),
        );
        if (isFuzzyDupeExisting) {
          filteredFuzzyDupe++;
          continue;
        }

        // Fuzzy dedup within this batch
        const isFuzzyDupeBatch = [...scored.keys()].some((existingSlug) =>
          slugsAreSimilar(slug, existingSlug),
        );
        if (isFuzzyDupeBatch) {
          filteredFuzzyDupe++;
          continue;
        }

        if (scored.has(slug)) {
          if (score > scored.get(slug).score) scored.get(slug).score = score;
          continue;
        }

        const rawTitle = titleCase(suggestion);
        const title = capTitle(rawTitle, getTitleSuffix(rawTitle));
        const categorySlug = inferCategoryFromTopic(slug, suggestion);
        // Use the category as the "brand" context for articles with no single brand
        const brand = "";
        scored.set(slug, {
          title,
          brand,
          score,
          categorySlug,
          coverImage: getCoverImage(categorySlug),
        });
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  if (!cached) {
    console.log(
      "Filtered: " +
        filteredOffTopic +
        " off-topic, " +
        filteredFuzzyDupe +
        " fuzzy duplicates\n",
    );
    saveTopicCache(scored);
  }

  // Filtered here rather than trusting the cache: candidates written since the
  // sweep must drop out, or a cached run would regenerate an article that
  // already exists.
  const ranked = Array.from(scored.entries())
    .filter(([slug]) => !existingSlugs.has(slug))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, MAX_NEW_ARTICLES);

  if (ranked.length === 0) {
    console.log(
      "No new topics found — all autocomplete suggestions already exist as articles.",
    );
    return;
  }

  console.log("Top " + ranked.length + " new topics:\n");
  ranked.forEach(([, { title, score }], i) =>
    console.log(
      "  " + String(i + 1).padStart(2) + ". [score:" + score + "] " + title,
    ),
  );
  console.log();

  if (!fs.existsSync(ARTICLES_DIR))
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });

  const { created, failed, unresearched, fatal } = await generateBatch(
    client,
    ranked,
    existingSlugs,
  );

  // One tally, from describeOutcome, rather than a raw count here and a verdict
  // below that could disagree with it.
  const outcome = describeOutcome({ created, failed, unresearched, fatal });
  if (!outcome.ok) {
    console.error("\n" + outcome.message);
    process.exit(1);
  }

  console.log("\n" + outcome.message);
  console.log("Research and generation complete.");
}

// Only run when invoked directly. Importing this module (for tests) must not
// start a generation run.
const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
}
