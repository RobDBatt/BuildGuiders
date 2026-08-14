import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

export const dynamic = "force-static";

const BASE = "https://www.buildguiders.com";

const CALCULATORS: [string, string][] = [
  ["Deck material calculator", "/deck-calculator"],
  ["Deck stain calculator", "/deck-stain-calculator"],
  ["Concrete calculator", "/concrete-calculator"],
  ["Paint calculator", "/paint-calculator"],
  ["Flooring calculator", "/flooring-calculator"],
  ["Tile calculator", "/tile-calculator"],
  ["Drywall calculator", "/drywall-calculator"],
  ["Fence calculator", "/fence-calculator"],
  ["Mulch calculator", "/mulch-calculator"],
  ["Grass seed calculator", "/grass-seed-calculator"],
  ["Wallpaper calculator", "/wallpaper-calculator"],
  ["Raised garden bed calculator", "/raised-garden-bed-calculator"],
  ["Pool volume calculator", "/pool-volume-calculator"],
];

function label(category: unknown): string {
  const c = String(category ?? "").trim();
  if (!c) return "Other guides";
  return c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function GET() {
  const dir = join(process.cwd(), "content", "articles");
  const byCategory = new Map<string, { title: string; slug: string; description: string }[]>();

  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    try {
      const { data } = matter(readFileSync(join(dir, file), "utf8"));
      if (data.published === false) continue;
      const slug = data.slug ?? file.replace(/\.mdx$/, "");
      const category = label(data.category);
      const description = String(data.description ?? "").replace(/\s+/g, " ").trim();
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push({ title: data.title ?? slug, slug, description });
    } catch {
      // skip unparseable files rather than failing the whole route
    }
  }

  const lines: string[] = [
    "# BuildGuiders",
    "",
    "> Home improvement buying guides and free project calculators: decking, deck stain, exterior paint, flooring, mulch, and more. Guides compare researched product options; calculators estimate materials and cost for common DIY projects.",
    "",
    "Content is written by the BuildGuiders editorial team; the site is supported by Amazon affiliate links, disclosed on every page.",
    "",
    "## Calculators",
    "",
    ...CALCULATORS.map(([name, path]) => `- [${name}](${BASE}${path})`),
    "",
  ];

  for (const [category, articles] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`## ${category} Guides`, "");
    for (const a of articles.sort((x, y) => x.title.localeCompare(y.title))) {
      lines.push(`- [${a.title}](${BASE}/guides/${a.slug})${a.description ? `: ${a.description}` : ""}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
