import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

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
