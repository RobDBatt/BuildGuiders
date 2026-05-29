import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");
const contentRoot = path.join(repoRoot, "content", "articles");
const outputPath = path.join(repoRoot, "tools", "report-amazon-links.txt");

const AMAZON_REGEX = /https?:\/\/[^)\s"]*amazon\./gi;
const GG_REGEX = /<GG\w+Recommendation\s*\/>/g;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  try {
    const files = await walk(contentRoot);
    const rows = [];

    for (const file of files) {
      const raw = await fs.readFile(file, "utf8");
      const parsed = matter(raw);
      const data = parsed.data || {};
      const content = parsed.content || "";

      const published = data.published !== false;
      const slug =
        (data.slug && String(data.slug)) ||
        (data.title && String(data.title)) ||
        path.basename(file, ".mdx");

      const hasAmazonDomain = AMAZON_REGEX.test(content);
      const ggMatches = content.match(GG_REGEX) || [];
      const ggSnippetCount = ggMatches.length;
      const hasGGRecommendation = ggSnippetCount > 0;
      const hasAffiliate = hasAmazonDomain || hasGGRecommendation;

      rows.push({
        file: path.relative(repoRoot, file).replace(/\\/g, "/"),
        slug,
        published,
        hasAffiliate,
        hasAmazonDomain,
        ggSnippetCount,
      });
    }

    rows.sort((a, b) => {
      if (a.published !== b.published) return a.published ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });

    const lines = [];
    lines.push("BuildGuiders Amazon Link Report");
    lines.push("================================");
    lines.push("");
    lines.push("Columns: [P]ublished, [A]ffiliate, [D]irectAmazonURL, GGSnippetCount, slug (file)");
    lines.push("");

    for (const r of rows) {
      const p = r.published ? "Y" : "N";
      const a = r.hasAffiliate ? "Y" : "N";
      const d = r.hasAmazonDomain ? "Y" : "N";
      lines.push(
        `[${p}] [${a}] [${d}] GG=${r.ggSnippetCount.toString().padStart(2, " ")}  ${r.slug} (${path.basename(r.file)})`,
      );
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, lines.join("\n"), "utf8");

    const publishedTotal = rows.filter((r) => r.published).length;
    const publishedWithAffiliate = rows.filter(
      (r) => r.published && r.hasAffiliate,
    ).length;

    console.log(`Report written to: ${path.relative(repoRoot, outputPath)}`);
    console.log(
      `Published articles with any affiliate: ${publishedWithAffiliate}/${publishedTotal}`,
    );
  } catch (err) {
    console.error("Error generating Amazon link report:", err);
    process.exit(1);
  }
}

main();

// Usage:
//   cd C:\\Sites-Vercel\\BuildGuiders
//   npm run report:amazon-links
//
// Output:
//   - tools/report-amazon-links.txt  (detailed per-article summary)
//   - Console summary: "Published articles with any affiliate: X/Y"
