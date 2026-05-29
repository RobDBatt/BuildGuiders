// lib/taxonomy.ts

import { CATEGORIES, normalizeCategoryKey } from "./categories";

const categoryConfigByKey = new Map(
  CATEGORIES.map((cat) => [normalizeCategoryKey(cat.slug), cat] as const),
);

export function formatCategory(raw?: string): string | undefined {
  if (!raw) return undefined;
  const key = normalizeCategoryKey(raw);
  if (!key) return undefined;

  const config = categoryConfigByKey.get(key);
  if (config) return config.label;

  // Fallback: title case
  return raw
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
