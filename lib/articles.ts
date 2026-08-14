import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Site-wide fallback image. Ships in public/, so it always resolves. */
export const FALLBACK_IMAGE = "/og-default.png";

/**
 * Frontmatter `coverImage` paths point at /images/covers/*.png, which are not in
 * the repo. A schema `image` that 404s invalidates the Article rich result, so
 * resolve against public/ at build time and fall back to the OG image. If the
 * cover files are added later they get picked up with no code change.
 */
export function resolveCoverImage(coverImage?: string): string {
  if (!coverImage) return FALLBACK_IMAGE;
  const onDisk = path.join(PUBLIC_DIR, coverImage.replace(/^\//, ""));
  return fs.existsSync(onDisk) ? coverImage : FALLBACK_IMAGE;
}

export interface Product {
  name: string;
  description?: string;
  url: string;
  note: string;
}

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  coverImage?: string;
  coverAlt?: string;
  tags?: string[];
  keywords?: string;
  products?: Product[];
  published: boolean;
}

export interface Article extends ArticleMeta {
  content: string;
}

function getArticleFiles(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

export function getAllArticles(): ArticleMeta[] {
  return getArticleFiles()
    .map((filename) => {
      const slug = filename.replace(/\.(mdx|md)$/, "");
      const fullPath = path.join(ARTICLES_DIR, filename);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "general",
        coverImage: data.coverImage,
        coverAlt: data.coverAlt,
        tags: data.tags ?? [],
        keywords: data.keywords ?? "",
        products: data.products ?? [],
        published: data.published !== false,
      } as ArticleMeta;
    })
    .filter((a) => a.published)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export function getArticleBySlug(slug: string): Article | null {
  const candidates = [`${slug}.mdx`, `${slug}.md`];
  for (const filename of candidates) {
    const fullPath = path.join(ARTICLES_DIR, filename);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "general",
        coverImage: data.coverImage,
        coverAlt: data.coverAlt,
        tags: data.tags ?? [],
        keywords: data.keywords ?? "",
        products: data.products ?? [],
        published: data.published !== false,
        content,
      };
    }
  }
  return null;
}

export function getAllCategories(): string[] {
  const articles = getAllArticles();
  return [...new Set(articles.map((a) => a.category))].sort();
}
