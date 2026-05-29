import { getAllMdxMeta } from "../postIndex";

function cleanSlug(raw: string | undefined | null): string {
  if (!raw) return "";

  // Drop leading slashes
  let s = raw.replace(/^\/+/, "");

  // Strip known directory prefixes like posts/, brands/, categories/, articles/
  const prefixes = ["posts/", "brands/", "categories/", "articles/"];
  for (const prefix of prefixes) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length);
      break;
    }
  }

  // Drop any trailing slash
  s = s.replace(/\/+$/, "");

  return s;
}

function normalizeBrands(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    // allow comma-separated strings too
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeCategory(value: any): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim().length);
    return first ? first.trim() : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}

export function getArticleRecords() {
  const posts = getAllMdxMeta();

  return posts
    // Hide backup files like "articles.bak-2025..."
    .filter((post: any) => {
      const file = post.sourceFilePath ?? post.slug ?? "";
      return !file.includes("articles.bak-");
    })
    // Enrich with clean slug + normalized brands/category
    .map((post: any) => {
      const rawSlug = post.slug ?? post.sourceFilePath ?? "";
      const slug = cleanSlug(rawSlug);

      // Prefer explicit frontmatter fields, but be flexible
      const brands = normalizeBrands(post.brands ?? post.brand);
      const category = normalizeCategory(
        post.category ?? post.categories ?? post.topic
      );

      return {
        ...post,
        slug,
        brands,
        category,
      };
    })
    // Sort by date (newest first)
    .sort((a: any, b: any) => {
      const aDate = a.date ? Date.parse(a.date) : 0;
      const bDate = b.date ? Date.parse(b.date) : 0;
      return bDate - aDate;
    });
}
