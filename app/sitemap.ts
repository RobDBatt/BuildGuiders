// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllArticles, getAllCategories } from "@/lib/articles";
import { normalizeCategoryKey } from "@/lib/categories";

export const runtime = "nodejs";

const BASE_URL = "https://www.buildguiders.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const addEntry = (entry: MetadataRoute.Sitemap[0]) => {
    // defense-in-depth: never allow spaces in <loc>
    if (entry.url.includes(" ")) return;
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  // Static routes
  addEntry({
    url: `${BASE_URL}/articles`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  });

  addEntry({
    url: `${BASE_URL}/categories`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  });

  // Categories (normalize at emit-time)
  const categories = await getAllCategories();
  for (const cat of categories) {
    const raw = String((cat as any)?.slug ?? "");
    const slug = normalizeCategoryKey(raw);
    if (!slug) continue;

    addEntry({
      url: `${BASE_URL}/categories/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // Posts: Output at root slug (e.g. /my-slug)
  const articles = getAllArticles();
  for (const a of articles) {
    if (!a.slug) continue;

    let lastModified = now;
    if (a.date) {
      const d = new Date(a.date);
      if (!Number.isNaN(d.getTime())) lastModified = d;
    }
    if (lastModified > now) lastModified = now;

    addEntry({
      url: `${BASE_URL}/${a.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  addEntry({
    url: `${BASE_URL}/privacy`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  });

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}