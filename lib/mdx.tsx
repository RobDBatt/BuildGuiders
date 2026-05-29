import React from "react";
import path from "path";
import { promises as fs } from "fs";
import matter from "gray-matter";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

function safeSlug(slug: string): string {
  const only = slug.replace(/[^a-zA-Z0-9-_]/g, "");
  return only + ".mdx";
}

export type ArticleFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
  hero?: string;
  products?: Array<{ name: string; url: string; note?: string; }>;
  [key: string]: unknown;
};

export type LoadedArticle = {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
};

export async function listArticleSlugs(): Promise<string[]> {
  const files = await fs.readdir(ARTICLES_DIR);
  return files
    .filter((f) => f.toLowerCase().endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/i, ""));
}

export async function loadArticle(slug: string): Promise<LoadedArticle> {
  const filePath = path.join(ARTICLES_DIR, safeSlug(slug));
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  const cleaned = content.replace(/^\s*import\s+.+$/gm, "");
  return { slug, frontmatter: (data || {}) as ArticleFrontmatter, content: cleaned };
}

export async function loadAllArticles(): Promise<LoadedArticle[]> {
  const slugs = await listArticleSlugs();
  const articles = await Promise.all(slugs.map((s) => loadArticle(s)));
  articles.sort((a, b) => {
    const da = a.frontmatter.date ? Date.parse(String(a.frontmatter.date)) : 0;
    const db = b.frontmatter.date ? Date.parse(String(b.frontmatter.date)) : 0;
    return db - da;
  });
  return articles;
}

async function mdxToHtml(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings as any, { behavior: "wrap" })
    .use(rehypeStringify)
    .process(source);
  return String(file);
}

export async function getArticleContent(slug: string): Promise<{
  frontmatter: ArticleFrontmatter;
  html: string;
}> {
  const { frontmatter, content } = await loadArticle(slug);
  const html = await mdxToHtml(content);
  return { frontmatter, html };
}

export async function getPublishedSlugs(): Promise<string[]> {
  const all = await loadAllArticles();
  return all.filter(a => !a.frontmatter.draft).map(a => a.slug);
}

export async function getArticleMeta(slug: string): Promise<ArticleFrontmatter> {
  const { frontmatter } = await loadArticle(slug);
  return frontmatter;
}

export async function getArticleComponent(slug: string): Promise<React.ComponentType> {
  const { content, frontmatter } = await loadArticle(slug);
  const html = await mdxToHtml(content);

  const Article: React.FC = () => (
    <article className="prose prose-invert lg:prose-xl mx-auto max-w-3xl px-4">
      <div style={{ background: '#0ea5e9', color: 'black', padding: '8px 12px', borderRadius: 12, fontWeight: 700, margin: '12px 0' }}>
      </div>
      {frontmatter.title ? <h1>{frontmatter.title}</h1> : null}
      {frontmatter.description ? <p><em>{frontmatter.description}</em></p> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );

  return Article;
}
