// Single source of truth for the calculator list.
//
// This was duplicated in app/page.tsx only. Extracted when /calculators was added
// so the homepage and the hub cannot drift — a calculator missing from one of them
// is exactly the kind of gap that leaves a page with no crawl path.

export type Calculator = {
  emoji: string;
  title: string;
  description: string;
  href: string;
  status: string;
  tag?: string;
};

export const buildCalculators: Calculator[] = [
  {
    emoji: "🖌️",
    title: "Paint Calculator",
    description: "Gallons, primer, rollers, tape — the full kit. Never under-buy or make a second run.",
    href: "/paint-calculator",
    status: "live",
    tag: "Live",
  },
  {
    emoji: "🪵",
    title: "Flooring Calculator",
    description: "Square footage, waste factor, underlayment, and transition strips — all in one list.",
    href: "/flooring-calculator",
    status: "live",
  },
  {
    emoji: "🔲",
    title: "Tile Calculator",
    description: "Floor or wall tile with grout lines, adhesive, and the tools everyone forgets.",
    href: "/tile-calculator",
    status: "live",
  },
  {
    emoji: "🪚",
    title: "Deck Calculator",
    description: "Decking boards, joists, post concrete, and every piece of hardware for a solid build.",
    href: "/deck-calculator",
    status: "live",
  },
  {
    emoji: "🧱",
    title: "Drywall Calculator",
    description: "Sheet count, joint compound, tape, screws — the full mudding kit.",
    href: "/drywall-calculator",
    status: "live",
  },
  {
    emoji: "🌿",
    title: "Mulch & Topsoil",
    description: "Cubic yards or bags for any bed depth. Landscape fabric and edging included.",
    href: "/mulch-calculator",
    status: "live",
  },
  {
    emoji: "🏗️",
    title: "Concrete Calculator",
    description: "Slabs, footings, or post holes. Bags or yards — plus your mixing tools.",
    href: "/concrete-calculator",
    status: "live",
  },
  {
    emoji: "🪟",
    title: "Fence Calculator",
    description: "Posts, panels, concrete, post caps, and gate hardware for any fence run.",
    href: "/fence-calculator",
    status: "live",
  },
  {
    emoji: "🏠",
    title: "Roof Calculator",
    description: "Squares and shingle bundles from your footprint and pitch, plus underlayment and drip edge.",
    href: "/roof-calculator",
    status: "live",
    tag: "New",
  },
];

export const maintenanceCalculators: Calculator[] = [
  {
    emoji: "🖌️",
    title: "Deck Stain Calculator",
    description: "How many gallons you actually need — including railings. The part everyone under-buys.",
    href: "/deck-stain-calculator",
    status: "live",
    tag: "New",
  },
];

export const lawnGardenCalculators: Calculator[] = [
  {
    emoji: "🌱",
    title: "Grass Seed Calculator",
    description: "Pounds of seed, starter fertilizer, and straw cover — for new lawns, overseeding, or patch repair.",
    href: "/grass-seed-calculator",
    status: "live",
    tag: "New",
  },
  {
    emoji: "🥕",
    title: "Raised Garden Bed Soil",
    description: "Bags of soil, compost, and perlite to fill any raised bed. Premix or 60/30/10 DIY mix.",
    href: "/raised-garden-bed-calculator",
    status: "live",
    tag: "New",
  },
];

export const poolCalculators: Calculator[] = [
  {
    emoji: "🏊",
    title: "Pool Volume Calculator",
    description: "Gallons for rectangle, round, oval, or kidney pools — sloped floors handled, plus the chemical list.",
    href: "/pool-volume-calculator",
    status: "live",
    tag: "New",
  },
];

export const interiorCalculators: Calculator[] = [
  {
    emoji: "🌸",
    title: "Wallpaper Calculator",
    description: "Rolls, paste, and tools — peel-and-stick, pre-pasted, or traditional. Pattern repeat waste included.",
    href: "/wallpaper-calculator",
    status: "live",
    tag: "New",
  },
];

// Group order and headings match the homepage sections.
export const calculatorGroups: {
  eyebrow: string;
  heading: string;
  items: Calculator[];
}[] = [
  { eyebrow: "Build Calculators", heading: "Pick your project", items: buildCalculators },
  { eyebrow: "Maintenance Calculators", heading: "Keep it looking good", items: maintenanceCalculators },
  { eyebrow: "Lawn & Garden Calculators", heading: "Grow something great", items: lawnGardenCalculators },
  { eyebrow: "Pool & Water Calculators", heading: "Know what you're treating", items: poolCalculators },
  { eyebrow: "Interior Calculators", heading: "Finish the inside", items: interiorCalculators },
];

export const allCalculators: Calculator[] = calculatorGroups.flatMap((g) => g.items);
