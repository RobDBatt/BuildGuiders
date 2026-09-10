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

// Content category -> the calculator a guide in that category sends readers to.
//
// Lives here, beside the calculator list, because three separate copies of this
// mapping had already appeared: the guide template, the article generator, and
// the list above. The generator was taught all 14 categories while the template
// still knew 9, so a roofing or pool guide rendered no calculator CTA at all —
// silently, because the template guards on `calc &&`. One copy, read by both.
//
// The label is spelled out rather than derived from Calculator.title: two of the
// titles ("Mulch & Topsoil", "Raised Garden Bed Soil") do not read correctly with
// "Free" bolted on the front.
export const categoryCalculators: Record<
  string,
  { href: string; label: string }
> = {
  paint: { href: "/paint-calculator", label: "Free Paint Calculator" },
  flooring: { href: "/flooring-calculator", label: "Free Flooring Calculator" },
  tile: { href: "/tile-calculator", label: "Free Tile Calculator" },
  deck: { href: "/deck-calculator", label: "Free Deck Calculator" },
  drywall: { href: "/drywall-calculator", label: "Free Drywall Calculator" },
  landscaping: { href: "/mulch-calculator", label: "Free Mulch Calculator" },
  concrete: { href: "/concrete-calculator", label: "Free Concrete Calculator" },
  fence: { href: "/fence-calculator", label: "Free Fence Calculator" },
  "stain-sealer": { href: "/deck-stain-calculator", label: "Free Deck Stain Calculator" },
  roofing: { href: "/roof-calculator", label: "Free Roof Calculator" },
  lawn: { href: "/grass-seed-calculator", label: "Free Grass Seed Calculator" },
  garden: { href: "/raised-garden-bed-calculator", label: "Free Raised Bed Soil Calculator" },
  pool: { href: "/pool-volume-calculator", label: "Free Pool Volume Calculator" },
  wallpaper: { href: "/wallpaper-calculator", label: "Free Wallpaper Calculator" },
};
