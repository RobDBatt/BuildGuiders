import {
  ArticleRecord,
  BrandBreakdown,
  CategoryBreakdown,
  DashboardOverview,
  PipelineHealth,
} from "./types";

const mockArticles: ArticleRecord[] = [
  {
    id: "1",
    slug: "lg-c2-earc-not-working-denon",
    title: "LG C2 eARC Not Working With Denon Receiver",
    status: "published",
    brands: ["LG", "Denon"],
    category: "sound-hdmi",
    discoveredAt: "2025-11-10T10:00:00Z",
    publishedAt: "2025-11-11T14:05:00Z",
    lastUpdatedAt: "2025-11-11T14:05:00Z",
    url: "/solutions/lg-c2-earc-not-working-denon",
    score: 91,
    expectedParts: ["hdmi-2-1-cable"],
  },
  {
    id: "2",
    slug: "apple-tv-4k-dolby-vision-flickering-lg-oled",
    title: "Apple TV 4K Dolby Vision Flickering on LG OLED",
    status: "awaiting_review",
    brands: ["Apple", "LG"],
    category: "streaming-boxes",
    discoveredAt: "2025-11-11T09:30:00Z",
    lastUpdatedAt: "2025-11-11T15:12:00Z",
    score: 88,
    expectedParts: ["ultra-high-speed-hdmi-cable"],
  },
  {
    id: "3",
    slug: "samsung-qn90c-no-signal-hdmi-4-4k120",
    title: "Samsung QN90C No Signal on HDMI 4 at 4K120",
    status: "drafted",
    brands: ["Samsung"],
    category: "tv-display",
    discoveredAt: "2025-11-12T08:00:00Z",
    score: 84,
    expectedParts: ["hdmi-2-1-cable"],
  },
  {
    id: "4",
    slug: "roku-ultra-keeps-rebooting-after-update",
    title: "Roku Ultra Keeps Rebooting After Firmware Update",
    status: "published",
    brands: ["Roku"],
    category: "streaming-boxes",
    discoveredAt: "2025-11-09T13:00:00Z",
    publishedAt: "2025-11-10T11:20:00Z",
    lastUpdatedAt: "2025-11-10T11:20:00Z",
    url: "/solutions/roku-ultra-keeps-rebooting-after-update",
    score: 79,
  },
];

function computeBrandBreakdown(articles: ArticleRecord[]): BrandBreakdown[] {
  const map = new Map<string, number>();
  for (const article of articles) {
    for (const brand of article.brands) {
      map.set(brand, (map.get(brand) ?? 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([brand, count]) => ({ brand, count }));
}

function computeCategoryBreakdown(articles: ArticleRecord[]): CategoryBreakdown[] {
  const map = new Map<string, number>();
  for (const article of articles) {
    map.set(article.category, (map.get(article.category) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
}

function computePipelineHealth(): PipelineHealth {
  // For now this is mocked. Later we can base this on real job runs / logs.
  return {
    scout: "ok",
    planner: "ok",
    writer: "ok",
    auditor: "ok",
    publisher: "ok",
  };
}

export function getDashboardOverview(): DashboardOverview {
  const todayActivity = {
    generated: 4,
    published: 2,
    needsReview: mockArticles.filter(a => a.status === "awaiting_review").length,
    errors: 0,
  };

  const inventory = {
    totalLive: mockArticles.filter(a => a.status === "published").length,
    drafts: mockArticles.filter(a => a.status === "drafted").length,
    archived: mockArticles.filter(a => a.status === "archived").length,
  };

  const pipelineHealth = computePipelineHealth();
  const brandBreakdown = computeBrandBreakdown(mockArticles);
  const categoryBreakdown = computeCategoryBreakdown(mockArticles);

  return {
    todayActivity,
    inventory,
    pipelineHealth,
    brandBreakdown,
    categoryBreakdown,
  };
}

export function getMockArticles(): ArticleRecord[] {
  return mockArticles;
}
