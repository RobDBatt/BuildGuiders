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
const MAX_NEW_ARTICLES = 20;
// Gemini model. Overridable because model names move faster than this file:
// run `npm run models` to list what the key can actually reach, then set
// GEMINI_MODEL to one of them. The default is the one the earlier Gemini
// scripts on the old branch used, and it is still current.
const MODEL = normalizeModelName(process.env.GEMINI_MODEL) || "gemini-2.5-flash";

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
// SPEC VERIFICATION — web-search lookup for brand+product-specific articles
//
// When the title references a specific brand+product combination, we do a
// quick search to fetch verified specs BEFORE writing the article. This catches
// product-level errors (wrong coverage rates, wrong drying times, etc.)
// that no static validator can catch because they vary per product.
//
// Uses the same Gemini model with the Google Search grounding tool switched on.
// The OpenAI version called a dedicated search model (gpt-4o-search-preview);
// Gemini does this by attaching a tool to an ordinary model instead, so there is
// no separate search model to name.
//
// Set SPEC_VERIFY_ENABLED=false to skip (e.g. for offline testing).
// Hard timeout: 15s — if the search is slow the article is still written, just
// without the verified context, rather than blocking the run.
// ─────────────────────────────────────────────────────────────────────────────

const SPEC_VERIFY_MODEL = normalizeModelName(process.env.SPEC_VERIFY_MODEL) || MODEL;
const SPEC_VERIFY_ENABLED = process.env.SPEC_VERIFY_ENABLED !== "false";
const SPEC_VERIFY_TIMEOUT_MS = 15_000;

// Detects specific brand+product names that warrant spec verification
const HAS_MODEL_RE = /\b(behr\s+\w+|sherwin.williams\s+\w+|benjamin\s+moore\s+\w+|trex\s+\w+|timbertech\s+\w+|fiberon\s+\w+|mapei\s+\w+|quikrete\s+\w+|sakrete\s+\w+|pergo\s+\w+|lifeproof\s+\w+|mohawk\s+\w+|armstrong\s+\w+|cabot\s+\w+|defy\s+extreme|zinsser\s+\w+)\b/i;

/**
 * Fetch verified product specs from the web for a brand+product-specific article.
 * Returns a compact bullet-point string or null if:
 *   - No specific brand+product detected in the title
 *   - Spec verification is disabled
 *   - The search times out or errors
 */
async function fetchVerifiedSpecs(client, title) {
  if (!SPEC_VERIFY_ENABLED) return null;
  if (!HAS_MODEL_RE.test(title)) return null;

  const prompt = `You are a home improvement product expert. For the following article title, provide key verified facts about the main product(s) mentioned — including coverage rates, drying times, square footage per unit, coat recommendations, and any critical compatibility notes. Be specific and factual.

Article title: "${title}"

Return a bullet-point list of verified facts only. If you are unsure of a fact, omit it rather than guessing.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SPEC_VERIFY_TIMEOUT_MS);

    const response = await client.models.generateContent({
      model: SPEC_VERIFY_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 350,
        temperature: 0,
        abortSignal: controller.signal,
      },
    });
    clearTimeout(timer);

    const raw = response.text?.trim() || "";
    if (!raw || raw.startsWith("NO_MODEL") || raw.length < 30) return null;

    // Strip citation markers ([1], [^2], etc.) that search models add
    const cleaned = raw.replace(/\s*\[\^?\d+\]/g, "").trim();
    console.log(`  [spec-verify] Fetched specs for "${title.substring(0, 60)}"`);
    return cleaned;
  } catch (err) {
    if (err.name === "AbortError" || /abort/i.test(err.message || "")) {
      console.warn(`  [spec-verify] Timed out after ${SPEC_VERIFY_TIMEOUT_MS / 1000}s — continuing without verified specs`);
    } else {
      console.warn(`  [spec-verify] Error: ${err.message} — continuing without verified specs`);
    }
    return null;
  }
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

  // Narrow first
  if (/pool|chlorine|pool shock|pool pump|pool filter|pool cover/.test(t)) return "pool";
  if (/wallpaper|peel.and.stick|wall covering/.test(t)) return "wallpaper";
  if (/raised (garden )?bed|garden soil|raised bed soil|potting mix|compost|perlite/.test(t)) return "garden";
  if (/grass seed|lawn|sod|overseed|starter fertilizer|straw mat/.test(t)) return "lawn";
  if (/roof|shingle|drip edge|roofing|ridge vent|soffit|flashing/.test(t)) return "roofing";
  if (/stain|sealer|sealant|exterior finish/.test(t)) return "stain-sealer";

  // Broad
  if (/paint|primer/.test(t)) return "paint";
  if (/floor|flooring|hardwood|vinyl plank|lvp|laminate|carpet|underlayment/.test(t)) return "flooring";
  if (/tile|grout|thinset|mortar|backsplash/.test(t)) return "tile";
  if (/deck|decking|composite|pressure.treated|deck board|deck screw|railing/.test(t)) return "deck";
  if (/drywall|sheetrock|joint compound|gypsum/.test(t)) return "drywall";
  if (/mulch|topsoil|landscape|edging|weed barrier/.test(t)) return "landscaping";
  if (/concrete|cement|quikrete|sakrete|post hole|slab|footing/.test(t)) return "concrete";
  if (/fence|fencing|picket|chain link/.test(t)) return "fence";

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
  verifiedSpecs = null,
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
    "Every article must:\n" +
    "1. Be a buying guide, not a how-to install guide\n" +
    "2. Help readers choose between products before they buy\n" +
    "3. Close by linking the reader to " + calculatorName + " at " + calculatorPath +
    " — e.g. \"Run your measurements through our free " + calculatorName.toLowerCase() +
    " to get an exact shopping list before you order.\" Use that exact path. If the " +
    "topic does not fit that calculator, link " + CALCULATOR_HUB + " instead. Do not " +
    "invent any other calculator path.\n" +
    "4. Include honest pros and cons — no fluff\n" +
    "5. Use plain, direct language, the way a knowledgeable person at a trade counter " +
    "would talk\n" +
    "6. Be 700-900 words, no padding\n\n" +
    "Structure every article with these H2 sections:\n" +
    "- \"What to Look for in [Product]\" (2-3 paragraphs on key decision factors)\n" +
    "- One H2 per top product recommendation (2-3 sentences each: who it's best for, key specs, honest caveat)\n" +
    "- \"What to Skip\" (1 paragraph — warn about common bad choices)\n" +
    "- \"Bottom Line\" (1 paragraph — direct recommendation, link to the calculator)\n\n" +
    "Start at H2. The title is rendered from frontmatter as the page's only H1, so " +
    "an H1 in the body would give the page two (AGENTS.md §11).\n\n" +
    "NEVER write installation tutorials.";

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

  const userPrompt = verifiedSpecs
    ? `Write a buying guide article for the following topic. Use these verified product facts as ground truth:\n\n${verifiedSpecs}\n\nTitle: ${title}\nBrand: ${brand || "various"}\nCategory: ${categorySlug}` +
      "\n\nWrite an MDX article body (NO frontmatter, NO H1 heading — the title is rendered separately from frontmatter). Start directly with the first H2 section.\n\n" +
      "Rules:\n" +
      "- Insert exactly one affiliate link: [" + product.name + " (paid link)](" + product.url + ") placed where it helps the reader most.\n" +
      "- No prices, ratings, or time-sensitive claims.\n" +
      "- Minimum 700 words of substantive content." +
      relatedLinksHint
    : `Write a buying guide article.\n\nTitle: ${title}\nBrand: ${brand || "various"}\nCategory: ${categorySlug}` +
      "\n\nWrite an MDX article body (NO frontmatter, NO H1 heading — the title is rendered separately from frontmatter). Start directly with the first H2 section.\n\n" +
      "Rules:\n" +
      "- Insert exactly one affiliate link: [" + product.name + " (paid link)](" + product.url + ") placed where it helps the reader most.\n" +
      "- No prices, ratings, or time-sensitive claims.\n" +
      "- Minimum 700 words of substantive content." +
      relatedLinksHint;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: system,
      temperature: 0.4,
      maxOutputTokens: 2500,
    },
  });

  const content = response.text;
  if (!content) {
    // An empty body is usually a safety block or a token cap, not a network
    // failure, so say which rather than leaving a bare "no content".
    const reason = response.candidates?.[0]?.finishReason;
    throw new Error(
      "Gemini returned no content for: " + title +
        (reason ? ` (finishReason: ${reason})` : ""),
    );
  }
  return content.trim();
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
  console.log("Researching topics via Google Autocomplete...\n");

  const scored = new Map();
  let filteredOffTopic = 0;
  let filteredFuzzyDupe = 0;

  for (const category of CATEGORIES) {
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

  console.log(
    "Filtered: " +
      filteredOffTopic +
      " off-topic, " +
      filteredFuzzyDupe +
      " fuzzy duplicates\n",
  );

  const ranked = Array.from(scored.entries())
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

  for (const [slug, { title, brand, categorySlug, coverImage }] of ranked) {
    const filePath = path.join(ARTICLES_DIR, slug + ".mdx");
    if (fs.existsSync(filePath)) {
      console.log("Skipping: " + slug);
      continue;
    }
    try {
      console.log("Generating: " + title);
      const product = pickProductForTopic(slug, categorySlug);
      const verifiedSpecs = await fetchVerifiedSpecs(client, title);
      const body = await generateArticleBody(
        client,
        title,
        brand,
        categorySlug,
        existingSlugs,
        product,
        verifiedSpecs,
      );
      const fm = buildFrontmatter(slug, title, brand, categorySlug, coverImage, product);
      fs.writeFileSync(filePath, fm + body + "\n", "utf8");
      existingSlugs.add(slug); // prevent dupes within this run
      console.log("Created: " + slug + ".mdx\n");
    } catch (err) {
      console.error("Failed: " + slug + " — " + err.message);
    }
  }

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
