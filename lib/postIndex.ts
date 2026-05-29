// Always safely coerce to string before .trim()
function safeString(val: unknown): string {
  return typeof val === "string" ? val : "";
}
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { validateArticleMeta } from "./articleValidation";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export type PostMeta = {
  slug: string;
  title: string;
  section?: string;
  categories?: string[];
  category?: string;
  brand?: string;
  coverImage?: string;
  coverAlt?: string;
  cover?: string;
  tags?: string[];
  url: string;
  date?: string;
  /**
   * Optional publish flag from frontmatter.
   * When explicitly set to false, the article should be treated as unpublished.
   * Missing or true values are treated as published.
   */
  published?: boolean;
  /**
   * Absolute path to the source MDX file.
   * Useful for filtering out backups and for admin/reporting tools.
   */
  sourceFilePath: string;
  /**
   * Frontmatter validation flag. Populated by articleValidation.
   */
  isValid?: boolean;
  validationErrors?: string[];
};

function readMdxFrontMatter(filePath: string): PostMeta | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);

    const normalizedPath = filePath.replace(/\\/g, "/");
    const relative = normalizedPath.split("/content/")[1];
    const parts = relative.split("/");
    const collection = parts[0] || "";
    const filename = parts.slice(1).join("/") || "";
    const fallbackSlug = filename.replace(/\.mdx$/, "");

    let title: string | undefined = data.title;
    if (!title) {
      const m = raw.match(/^title:\s*["']([^"']+)["']/m);
      if (m) title = m[1];
    }

    let slug: string =
      (safeString((data as any).slug).trim().length > 0
        ? safeString((data as any).slug).trim()
        : fallbackSlug) || fallbackSlug;

    const categories: string[] = Array.isArray((data as any).categories)
      ? (data as any).categories.map((c: any) => String(c))
      : [];

    let category: string | undefined =
      (safeString((data as any).category).trim().length > 0
        ? safeString((data as any).category).trim()
        : undefined) || (categories.length > 0 ? categories[0] : undefined);

    let tags: string[] | undefined;
    if (Array.isArray((data as any).tags)) {
      tags = (data as any).tags.map((t: any) => String(t));
    } else if (typeof (data as any).tags === "string") {
      tags = (data as any).tags
        .split(",")
        .map((t: string) => safeString(t).trim())
        .filter(Boolean);
    } else {
      const m = raw.match(/^tags:\s*\[([^\]]*)\]/m);
      if (m) {
        tags = m[1]
          .split(",")
          .map((t) => safeString(t).trim().replace(/^\"'|\"'$/g, ""))
          .filter(Boolean);
      }
    }

    const brand: string | undefined =
      (safeString((data as any).brand).trim().length > 0
        ? safeString((data as any).brand).trim()
        : undefined) || undefined;

    const coverImage: string | undefined =
      (data as any).coverImage ?? (data as any).cover ?? undefined;

    const coverAlt: string | undefined = (data as any).coverAlt;

    const url = "/" + [collection, slug].filter(Boolean).join("/");
    const date = (data as any).date ? String((data as any).date) : undefined;

    let published: boolean | undefined;
    if (typeof (data as any).published === "boolean") {
      published = (data as any).published;
    }

    const fallbackTitle = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const finalTitle = title ?? fallbackTitle;

    const base: PostMeta = {
      slug,
      title: finalTitle,
      section: (data as any).section,
      categories,
      category,
      tags,
      brand,
      coverImage,
      coverAlt,
      cover: (data as any).cover,
      url,
      date,
      published,
      sourceFilePath: filePath,
    };

    const { isValid, errors, warnings, label } = validateArticleMeta(base);

    if (!isValid) {
      console.warn(
        `[articleValidation] Invalid frontmatter in ${label}:\n  - ${errors.join(
          "\n  - ",
        )}`,
      );

      // In strict mode, fail fast so issues are obvious during local dev.
      if (process.env.CONTENT_STRICT === "1") {
        throw new Error(
          `[articleValidation] Strict mode: invalid frontmatter in ${label}`,
        );
      }
    } else if (warnings.length > 0) {
      console.warn(
        `[articleValidation] Warnings for ${label}:\n  - ${warnings.join(
          "\n  - ",
        )}`,
      );
    }

    return {
      ...base,
      isValid,
      validationErrors: isValid ? [] : errors,
    };
  } catch {
    return null;
  }
}

export function getAllMdxMeta(rootSubdir?: string): PostMeta[] {
  const baseDir = rootSubdir
    ? path.join(CONTENT_ROOT, rootSubdir)
    : CONTENT_ROOT;

  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const files: string[] = [];
  const walk = (dir: string) => {
    const name = path.basename(dir);
    // Skip known backup/legacy directories under content
    if (name.startsWith("articles.bak-") || name === "_legacy-backups") {
      return;
    }

    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (f.toLowerCase().endsWith(".mdx")) {
        files.push(full);
      }
    }
  };
  walk(baseDir);
  return files.map(readMdxFrontMatter).filter(Boolean) as PostMeta[];
}

function sortByDateDesc<T extends { date?: string }>(arr: T[]): T[] {
  return arr.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
}

export async function getPostsByCategory(cat: string): Promise<PostMeta[]> {
  const all = getAllMdxMeta();
  return sortByDateDesc(
    all.filter((p) => p.categories?.some((c) => c.toLowerCase() === cat.toLowerCase()))
  );
}

export async function getPostsBySection(section: string): Promise<PostMeta[]> {
  const all = getAllMdxMeta();
  return sortByDateDesc(
    all.filter((p) => (p.section || "").toLowerCase() === section.toLowerCase())
  );
}
