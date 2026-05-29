// lib/articles.ts

import { getAllMdxMeta, type PostMeta } from "./postIndex";
import { getArticleContent } from "./mdx";
import { CATEGORIES, normalizeCategoryKey } from "./categories";

export type ArticleMeta = PostMeta;

export type Article = {
  slug: string;
  title: string;
  description?: string;
  brand?: string;
  coverImage?: string;
  cover?: string;
  category?: string;
  tags?: string[];
  date?: string;
  url: string;
  html: string;
  products?: Array<{ name: string; url: string; note?: string }>;
};

export type BrandSummary = {
  slug: string;
  label: string;
  count: number;
};

export type CategorySummary = {
  slug: string;
  label: string;
  count: number;
  summary?: string;
};

export function byDateDesc(a?: string, b?: string) {
  const A = a ? Date.parse(a) : 0;
  const B = b ? Date.parse(b) : 0;
  return B - A;
}

// Always safely coerce to string before .trim()
function safeString(val: unknown): string {
  return typeof val === "string" ? val : "";
}

// Return all article/post metadata.
export function getAllArticles(): ArticleMeta[] {
  return getAllMdxMeta("articles")
    .filter((meta) => (meta as ArticleMeta).published !== false)
    .map((meta) => {
      let brand = safeString(meta.brand).trim() ? safeString(meta.brand) : "other";
      let category = safeString(meta.category).trim()
        ? safeString(meta.category)
        : "uncategorized";
      if (typeof meta.brand !== "string") {
        // eslint-disable-next-line no-console
        console.warn("[ArticleMeta] Non-string brand:", meta.slug, meta.brand);
      }
      if (typeof meta.category !== "string") {
        // eslint-disable-next-line no-console
        console.warn("[ArticleMeta] Non-string category:", meta.slug, meta.category);
      }
      return { ...meta, brand, category };
    }) as ArticleMeta[];
}

// Some code may call this name instead.
export function getAllArticlesMeta(): ArticleMeta[] {
  return getAllMdxMeta("articles").filter(
    (meta) => (meta as ArticleMeta).published !== false,
  ) as ArticleMeta[];
}

// Derive all distinct brands from article metadata.
export async function getAllBrands(): Promise<BrandSummary[]> {
  const articles = getAllArticles() as ArticleMeta[];
  const map = new Map<string, BrandSummary>();

  for (const article of articles) {
    let slug: string;
    let label: string;
    if (safeString(article.brand).trim()) {
      let rawSlug = safeString(article.brand).trim().toLowerCase();

      // Normalization mappings
      if (rawSlug === "apple tv") rawSlug = "apple";
      if (rawSlug === "samsung tv") rawSlug = "samsung";
      if (rawSlug === "lg tv") rawSlug = "lg";
      if (rawSlug === "sony tv") rawSlug = "sony";

      slug = rawSlug;

      label =
        slug === "lg"
          ? "LG"
          : slug === "tcl"
            ? "TCL"
            : slug
              .split(/[-\s]+/)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");

      // Special label fix for Apple
      if (slug === "apple") label = "Apple";
    } else {
      slug = "other";
      label = "Other Brands";
    }
    const existing = map.get(slug);
    if (existing) {
      existing.count += 1;
      continue;
    }
    map.set(slug, { slug, label, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export async function getFeaturedBrands(
  slugs: string[],
): Promise<BrandSummary[]> {
  const all = await getAllBrands();

  const bySlug = new Map(
    all.map(
      (brand) =>
        [safeString(brand.slug).trim().toLowerCase(), brand] as const,
    ),
  );

  const normalizedOrder = slugs
    .map((slug) => safeString(slug).trim().toLowerCase())
    .filter((slug) => slug.length > 0);

  const seen = new Set<string>();
  const featured: BrandSummary[] = [];

  for (const slug of normalizedOrder) {
    if (seen.has(slug)) continue;
    const brand = bySlug.get(slug);
    if (brand) {
      featured.push(brand);
      seen.add(slug);
    }
  }

  return featured;
}

export async function getAllCategories(): Promise<CategorySummary[]> {
  const articles = getAllArticles() as ArticleMeta[];

  const map = new Map<string, CategorySummary>();
  const categoryConfigByKey = new Map(
    CATEGORIES.map((cat) => [normalizeCategoryKey(cat.slug), cat] as const),
  );

  for (const article of articles) {
    const raw = (article.category as string | undefined) ?? undefined;
    if (!raw) continue;

    const key = normalizeCategoryKey(raw);
    if (!key) continue;

    const config = categoryConfigByKey.get(key);
    const slug = key; // ALWAYS normalized and safe

    const label =
      config?.label ??
      slug
        .split(/[-\s]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        slug,
        label,
        count: 1,
        summary: config?.description,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export async function getFeaturedCategories(
  slugs: string[],
): Promise<CategorySummary[]> {
  const all = await getAllCategories();

  const bySlug = new Map(
    all.map(
      (category) =>
        [safeString(category.slug).trim().toLowerCase(), category] as const,
    ),
  );

  const normalizedOrder = slugs
    .map((slug) => safeString(slug).trim().toLowerCase())
    .filter((slug) => slug.length > 0);

  const seen = new Set<string>();
  const featured: CategorySummary[] = [];

  for (const slug of normalizedOrder) {
    if (seen.has(slug)) continue;
    const cat = bySlug.get(slug);
    if (cat) {
      featured.push(cat);
      seen.add(slug);
    }
  }

  return featured;
}

export function getRelatedArticles(
  article: Pick<ArticleMeta, "slug" | "brand" | "category" | "date">,
  limit: number = 3,
): ArticleMeta[] {
  const all = getAllArticles() as ArticleMeta[];

  // Normalize for comparison
  const normalizedBrand = safeString(article.brand).trim().toLowerCase();
  const normalizedCategory = normalizeCategoryKey(
    safeString(article.category),
  );

  const scored = all
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      let score = 0;
      const brand = safeString(a.brand).trim().toLowerCase();
      // Normalize comparison target too
      const category = normalizeCategoryKey(safeString(a.category));

      if (normalizedBrand && brand === normalizedBrand) score += 2;
      if (normalizedCategory && category === normalizedCategory) score += 1;
      return { article: a, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.article.date ? Date.parse(a.article.date) || 0 : 0;
    const bTime = b.article.date ? Date.parse(b.article.date) || 0 : 0;
    return bTime - aTime;
  });

  return scored.slice(0, limit).map((entry) => entry.article);
}

export async function getArticlesByCategorySlug(
  slug: string,
): Promise<ArticleMeta[]> {
  const all = getAllArticles() as ArticleMeta[];
  const normalized = normalizeCategoryKey(slug);

  if (!normalized) return [];

  return all.filter((article) => {
    const raw = (article.category as string | undefined) ?? undefined;
    if (!raw) return false;
    // Normalize both sides of the comparison
    return normalizeCategoryKey(raw) === normalized;
  });
}

export async function getArticlesByBrandSlug(
  slug: string,
): Promise<ArticleMeta[]> {
  const all = getAllArticles() as ArticleMeta[];
  const normalized = safeString(slug).trim()
    ? safeString(slug).trim().toLowerCase()
    : "other";

  if (!normalized) return [];

  return all.filter((article) => {
    const raw = safeString(article.brand).trim()
      ? safeString(article.brand)
      : "other";
    return safeString(raw).trim().toLowerCase() === normalized;
  });
}

export async function getLatestArticles(
  limit: number = 3,
): Promise<ArticleMeta[]> {
  const all = getAllArticles();
  // Sort by date descending; missing/invalid dates go to the bottom.
  const sorted = [...all].sort((a, b) => byDateDesc(a.date, b.date));
  return sorted.slice(0, limit);
}

// Detail loader used by app/posts/[slug]/page.tsx.
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const metas = getAllMdxMeta("articles") as ArticleMeta[];
  const meta = metas.find((m) => m.slug === slug);

  try {
    const { frontmatter, html } = await getArticleContent(slug);

    const title =
      (frontmatter.title as string | undefined) ?? meta?.title ?? slug;

    const description =
      (frontmatter.description as string | undefined) ??
      (meta as any)?.description;

    // Always default brand/category to safe strings
    let brand = (frontmatter as any).brand ?? meta?.brand;
    if (typeof brand !== "string" || !brand.trim()) brand = "other";
    brand = safeString(brand);

    const coverImage =
      (frontmatter as any).coverImage ??
      meta?.coverImage ??
      (frontmatter as any).cover ??
      meta?.cover;

    const cover = (frontmatter as any).cover ?? meta?.cover ?? coverImage;

    let category = (frontmatter as any).category ?? meta?.category;
    if (typeof category !== "string" || !category.trim())
      category = "uncategorized";
    category = safeString(category);

    const tags = (frontmatter.tags as string[] | undefined) ?? meta?.tags;

    const date = (frontmatter.date as string | undefined) ?? meta?.date;

    const url = meta?.url ?? `/${slug}`;

    const products = (frontmatter.products as any[] | undefined)?.map((p) => ({
      name: safeString(p.name),
      url: safeString(p.url),
      note: p.note ? safeString(p.note) : undefined,
    }));

    return {
      slug,
      title,
      description,
      brand,
      coverImage,
      cover,
      category,
      tags,
      date,
      url,
      html,
      products,
    };
  } catch {
    if (!meta) return null;

    return {
      slug,
      title: meta.title,
      description: (meta as any).description,
      brand: meta.brand,
      coverImage: meta.coverImage ?? meta.cover,
      cover: meta.cover ?? meta.coverImage,
      category: meta.category,
      tags: meta.tags,
      date: meta.date,
      url: meta.url,
      html: "",
    };
  }
}
