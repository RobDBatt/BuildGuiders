import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://buildguiders.com";

  const calculators = [
    { path: "/about", priority: 0.7 },
    { path: "/privacy", priority: 0.4 },
    { path: "/paint-calculator", priority: 0.9 },
    { path: "/flooring-calculator", priority: 0.9 },
    { path: "/tile-calculator", priority: 0.9 },
    { path: "/deck-calculator", priority: 0.9 },
    { path: "/drywall-calculator", priority: 0.8 },
    { path: "/mulch-calculator", priority: 0.8 },
    { path: "/concrete-calculator", priority: 0.8 },
    { path: "/fence-calculator", priority: 0.8 },
    { path: "/deck-stain-calculator", priority: 0.8 },
    { path: "/grass-seed-calculator", priority: 0.9 },
    { path: "/wallpaper-calculator", priority: 0.9 },
    { path: "/raised-garden-bed-calculator", priority: 0.8 },
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...calculators.map(({ path, priority }) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority,
    })),
  ];
}
