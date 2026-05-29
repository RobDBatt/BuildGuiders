export type ArticleStatus =
  | "discovered"
  | "planned"
  | "drafted"
  | "awaiting_review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  brands: string[];
  category: string;
  discoveredAt: string;
  publishedAt?: string;
  lastUpdatedAt?: string;
  url?: string;
  score?: number; // from Scout
  expectedParts?: string[];
};

export type PipelineHealth = {
  scout: "ok" | "warning" | "error";
  planner: "ok" | "warning" | "error";
  writer: "ok" | "warning" | "error";
  auditor: "ok" | "warning" | "error";
  publisher: "ok" | "warning" | "error";
};

export type TodayActivity = {
  generated: number;
  published: number;
  needsReview: number;
  errors: number;
};

export type ContentInventory = {
  totalLive: number;
  drafts: number;
  archived: number;
};

export type BrandBreakdown = {
  brand: string;
  count: number;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
};

export type DashboardOverview = {
  todayActivity: TodayActivity;
  inventory: ContentInventory;
  pipelineHealth: PipelineHealth;
  brandBreakdown: BrandBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
};
