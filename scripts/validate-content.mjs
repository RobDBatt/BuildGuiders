// scripts/validate-content.mjs
// Validate MDX article frontmatter under content/articles using the shared
// articleValidation helper. Intended for local/CI use.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { validateArticleMeta } from "../lib/articleValidation.js";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

function walkArticlesDir(dir) {
  if (!fs.existsSync(dir)) return [];

  /** @type {string[]} */
  const files = [];

  function recurse(current) {
    const name = path.basename(current);
    // Skip known backup/legacy directories
    if (name.startsWith("articles.bak-") || name === "_legacy-backups") {
      return;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
        files.push(fullPath);
      }
    }
  }

  recurse(dir);
  return files;
}

function buildMetaFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const normalizedPath = filePath.replace(/\\/g, "/");
  const relative = normalizedPath.split("/content/")[1] || "";
  const parts = relative.split("/");
  const collection = parts[0] || "articles";
  const filename = parts.slice(1).join("/") || "";
  const fallbackSlug = filename.replace(/\.mdx$/i, "");

  let slug =
    typeof data.slug === "string" && data.slug.trim().length > 0
      ? data.slug.trim()
      : fallbackSlug;

  let title =
    typeof data.title === "string" && data.title.trim().length > 0
      ? data.title.trim()
      : "";

  if (!title && slug) {
    title = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const coverImage =
    (data && data.coverImage) || (data && data.cover) || undefined;

  const url = "/" + [collection, slug].filter(Boolean).join("/");

  return {
    slug,
    title,
    section: data.section,
    categories: Array.isArray(data.categories) ? data.categories : undefined,
    category: data.category,
    brand: data.brand,
    coverImage,
    coverAlt: data.coverAlt,
    cover: data.cover,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    url,
    date: data.date ? String(data.date) : undefined,
    sourceFilePath: filePath,
    published: data.published,
    _rawContent: content,
    _rawData: data,
  };
}

function main() {
  console.log("🔍 Validating MDX content under content/articles...\n");

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log(`ℹ️  No content/articles directory found at ${ARTICLES_DIR}.`);
    process.exit(0);
  }

  const files = walkArticlesDir(ARTICLES_DIR);
  if (files.length === 0) {
    console.log("ℹ️  No .mdx files found under content/articles.");
    process.exit(0);
  }

  /** @type {{ meta: any; validation: ReturnType<typeof validateArticleMeta> }[]} */
  const results = [];

  for (const file of files) {
    const meta = buildMetaFromFile(file);
    const baseValidation = validateArticleMeta(meta);

    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];
    const isPublished = meta.published !== false;
    const body = meta._rawContent || "";

    if (isPublished) {
      for (const key of ["title", "category", "date"]) {
        if (!meta[key] || String(meta[key]).trim().length === 0) {
          errors.push(
            `Missing required frontmatter key "${key}" for published article.`,
          );
        }
      }

      const lines = body.split(/\r?\n/);
      let firstContentLine = "";
      for (const ln of lines) {
        if (ln.trim() !== "") {
          firstContentLine = ln.trim();
          break;
        }
      }
      if (
        meta.title &&
        (firstContentLine === `# ${meta.title}` ||
          firstContentLine === `## ${meta.title}`)
      ) {
        errors.push(
          "Duplicate title heading found in body (remove H1/H2 that repeats title).",
        );
      }

      const wordCount = (body.match(/\b\w+\b/g) || []).length;
      if (wordCount < 300) {
        errors.push(
          `Article too short for publish (word count: ${wordCount}, min: 300).`,
        );
      }

      const snippetCount =
        (body.match(/<GG\w+Recommendation\s*\/>/g) || []).length;
      if (snippetCount > 2) {
        errors.push(
          `Too many GG*Recommendation snippets in ${meta.sourceFilePath} (count: ${snippetCount}, max: 2).`,
        );
      }

      // Check for duplicate affiliate disclosure in body
      const disclosureStatement = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";
      if (body.includes(disclosureStatement)) {
        warnings.push(
          `Duplicate affiliate disclosure found in BODY content: "${disclosureStatement}". This is handled by the frontmatter product notes already.`
        );
      }
    }

    const validation = {
      ...baseValidation,
      errors,
      warnings,
      isValid: errors.length === 0,
    };

    results.push({ meta, validation });
  }

  const total = results.length;
  const invalid = results.filter((r) => !r.validation.isValid);
  const validCount = total - invalid.length;

  console.log(`Total articles: ${total}`);
  console.log(`Valid: ${validCount}`);
  console.log(`Invalid: ${invalid.length}`);

  if (invalid.length > 0) {
    console.log("\n❌ Invalid frontmatter found:\n");
    for (const { meta, validation } of invalid) {
      console.log(`- Slug: ${meta.slug || "<missing>"}`);
      console.log(`  File: ${meta.sourceFilePath}`);
      for (const err of validation.errors) {
        console.log(`    • ${err}`);
      }
      if (validation.warnings.length) {
        console.log("  Warnings:");
        for (const w of validation.warnings) {
          console.log(`    • ${w}`);
        }
      }
      console.log("");
    }
    process.exit(1);
  }

  // Print warnings even if valid
  const validWithWarnings = results.filter((r) => r.validation.isValid && r.validation.warnings.length > 0);
  if (validWithWarnings.length > 0) {
    console.log("\n⚠️  Warnings in valid articles:\n");
    for (const { meta, validation } of validWithWarnings) {
      console.log(`- Slug: ${meta.slug}`);
      console.log(`  File: ${meta.sourceFilePath}`);
      for (const w of validation.warnings) {
        console.log(`    • ${w}`);
      }
      console.log("");
    }
  }


  console.log("\n✅ All article frontmatter looks valid.");
  process.exit(0);
}

main();
