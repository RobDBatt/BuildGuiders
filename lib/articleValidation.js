// lib/articleValidation.js
// Lightweight validation for article frontmatter / PostMeta objects.
// Shared by the TS indexer and Node scripts.

/**
 * Validate a PostMeta-like object.
 * Expected shape (loosely):
 * {
 *   slug: string;
 *   title: string;
 *   date?: string;
 *   url?: string;
 *   coverImage?: string;
 *   cover?: string;
 *   category?: string;
 *   brand?: string;
 *   sourceFilePath?: string;
 * }
 *
 * Returns { isValid, errors, warnings }.
 */
export function validateArticleMeta(meta) {
  const errors = [];
  const warnings = [];

  const slug = typeof meta.slug === "string" ? meta.slug.trim() : "";
  const title = typeof meta.title === "string" ? meta.title.trim() : "";
  const date = typeof meta.date === "string" ? meta.date.trim() : "";
  const url = typeof meta.url === "string" ? meta.url.trim() : "";
  const coverImage =
    typeof meta.coverImage === "string" ? meta.coverImage.trim() : "";
  const cover = typeof meta.cover === "string" ? meta.cover.trim() : "";
  const category =
    typeof meta.category === "string" ? meta.category.trim() : "";
  const brand = typeof meta.brand === "string" ? meta.brand.trim() : "";

  const label =
    typeof meta.sourceFilePath === "string" && meta.sourceFilePath.length > 0
      ? meta.sourceFilePath
      : slug || "<unknown>";

  if (!slug) {
    errors.push("missing slug");
  }

  if (!title) {
    errors.push("missing title");
  }

  // Require a date and basic YYYY-MM-DD format with a parseable value
  if (!date) {
    errors.push("missing date");
  } else {
    const isoLike = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoLike.test(date) || Number.isNaN(Date.parse(date))) {
      errors.push(`invalid date format "${date}" (expected YYYY-MM-DD)`);
    }
  }

  if (!url) {
    errors.push("missing url");
  }

  if (!coverImage && !cover) {
    errors.push("missing coverImage / cover");
  }

  // Recommended, but not strictly required
  if (!category && !brand) {
    warnings.push("missing category/brand (recommended)");
  }

  // Basic slug hygiene (warn only)
  if (slug && /\s/.test(slug)) {
    warnings.push("slug contains whitespace");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    label,
  };
}

