import { ArticleRecord } from "./types";
import { getAllMdxMeta } from "../postIndex";

/**
 * Adapter that turns your existing MDX metadata into ArticleRecord[]
 * for the Admin Console.
 *
 * Assumes getAllMdxMeta() returns an array of objects with at least:
 *  - slug
 *  - title
 *  - updated or date (optional)
 *  - brand / brands (optional)
 *  - category (optional)
 */
export function getArticlesFromMdx(): ArticleRecord[] {
  const metas = (getAllMdxMeta() as any[]) ?? [];

  return metas.map((meta, index): ArticleRecord => {
    const slug = meta.slug ?? String(index);
    const title = meta.title ?? slug ?? "Untitled";
    const updated: string | undefined = meta.updated ?? meta.date;

    // Normalize brands into a string[]
    let brands: string[] = [];
    if (Array.isArray(meta.brand)) {
      brands = meta.brand;
    } else if (typeof meta.brand === "string") {
      brands = [meta.brand];
    } else if (Array.isArray(meta.brands)) {
      brands = meta.brands;
    }

    const category: string =
      meta.category ??
      meta.categorySlug ??
      "general";

    // Guess URL pattern; adjust if your solutions route is different
    const url =
      typeof slug === "string" && slug.length > 0
        ? `/solutions/${slug}`
        : undefined;

    return {
      id: meta.id ?? slug ?? String(index),
      slug,
      title,
      status: "published",
      brands,
      category,
      discoveredAt: updated ?? new Date().toISOString(),
      publishedAt: updated,
      lastUpdatedAt: updated,
      url,
      score: undefined,
      expectedParts: undefined,
    };
  });
}
