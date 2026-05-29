export type BasicArticle = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  updated?: string;
  brand?: string;
  device?: string;
  category?: string;
  tags?: string[];
};

function safeDateMs(s?: string): number {
  const ms = s ? Date.parse(s) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

export function getCategory(a: BasicArticle): string {
  if (a.category) return a.category.toLowerCase();

  const tags = (a.tags ?? []).map(t => t.toLowerCase());
  const brand = (a.brand ?? "").toLowerCase();
  const device = (a.device ?? "").toLowerCase();
  const tagStr = tags.join(" ");

  if (tagStr.includes("avr") || device.includes("avr")) return "avr";
  if (tagStr.includes("soundbar") || device.includes("soundbar")) return "soundbar";
  if (
    brand === "lg" || brand === "samsung" || brand === "sony" ||
    tagStr.includes("tv") || device.includes("oled") || device.includes("bravia") || device.includes("the frame")
  ) return "tv";
  if (tagStr.includes("cable") || tagStr.includes("hdmi")) return "cable";
  if (brand === "apple") return "streamer";

  return "other";
}

export function onePerCategory<T extends BasicArticle>(articles: T[], limit = 6): T[] {
  const sorted = [...articles].sort((a, b) => {
    const ad = Math.max(safeDateMs(a.updated), safeDateMs(a.date));
    const bd = Math.max(safeDateMs(b.updated), safeDateMs(b.date));
    return bd - ad;
  });

  const picked: T[] = [];
  const usedCats = new Set<string>();
  const usedSlugs = new Set<string>();

  for (const a of sorted) {
    const cat = getCategory(a);
    const slug = (a as any).slug ?? "";
    if (usedCats.has(cat) || usedSlugs.has(slug)) continue;
    usedCats.add(cat);
    usedSlugs.add(slug);
    picked.push(a);
    if (picked.length >= limit) return picked;
  }

  for (const a of sorted) {
    const slug = (a as any).slug ?? "";
    if (usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);
    picked.push(a);
    if (picked.length >= limit) break;
  }

  return picked;
}
