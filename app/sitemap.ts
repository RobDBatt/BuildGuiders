import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  // Canonical host is www (apex 307-redirects to www). Sitemap URLs must be
  // the final canonical URLs, not redirects.
  const baseUrl = "https://www.buildguiders.com";

  const staticPages = [
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/guides", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/paint-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/flooring-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/tile-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/deck-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/drywall-calculator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/mulch-calculator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/concrete-calculator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/fence-calculator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/deck-stain-calculator", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/grass-seed-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/wallpaper-calculator", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/raised-garden-bed-calculator", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  const now = new Date();

  const guideEntries: MetadataRoute.Sitemap = getAllArticles().map((article) => ({
    url: `${baseUrl}/guides/${article.slug}`,
    lastModified: article.date ? new Date(article.date) : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...staticPages.map(({ path, priority, changeFrequency }) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...guideEntries,
  ];
}
