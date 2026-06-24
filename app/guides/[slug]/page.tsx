import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import type { Metadata } from "next";

const CALCULATOR_LINKS: Record<string, { href: string; label: string }> = {
  paint: { href: "/paint-calculator", label: "Free Paint Calculator" },
  flooring: { href: "/flooring-calculator", label: "Free Flooring Calculator" },
  tile: { href: "/tile-calculator", label: "Free Tile Calculator" },
  deck: { href: "/deck-calculator", label: "Free Deck Calculator" },
  drywall: { href: "/drywall-calculator", label: "Free Drywall Calculator" },
  landscaping: { href: "/mulch-calculator", label: "Free Mulch Calculator" },
  concrete: { href: "/concrete-calculator", label: "Free Concrete Calculator" },
  fence: { href: "/fence-calculator", label: "Free Fence Calculator" },
  "stain-sealer": { href: "/deck-stain-calculator", label: "Free Deck Stain Calculator" },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `https://www.buildguiders.com/guides/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://www.buildguiders.com/guides/${slug}`,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article || !article.published) notFound();

  const calc = CALCULATOR_LINKS[article.category];

  return (
    <div style={{ background: "#FEFBF3", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "#FEFBF3", borderBottom: "1px solid #e7e3da", padding: "0 1.5rem" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1C1917", textDecoration: "none", letterSpacing: "-0.01em" }}>
            BuildGuiders
          </Link>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#78716c" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Calculators</Link>
            <Link href="/guides" style={{ color: "#1B4332", textDecoration: "none" }}>Guides</Link>
            <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "1rem 1.5rem 0" }}>
        <p style={{ fontSize: "0.8rem", color: "#a8a29e", margin: 0 }}>
          <Link href="/guides" style={{ color: "#78716c", textDecoration: "none", fontWeight: 600 }}>Guides</Link>
          {" / "}
          <span>{article.title}</span>
        </p>
      </div>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
        {/* Header */}
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1C1917", lineHeight: 1.2, margin: 0, marginBottom: "0.75rem" }}>
            {article.title}
          </h1>
          {article.description && (
            <p style={{ fontSize: "1.05rem", color: "#78716c", lineHeight: 1.6, margin: 0, marginBottom: "0.75rem" }}>
              {article.description}
            </p>
          )}
          {article.date && (
            <p style={{ fontSize: "0.8rem", color: "#a8a29e", margin: 0 }}>
              Updated{" "}
              {new Date(article.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </header>

        {/* Calculator CTA — top */}
        {calc && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#1B4332", fontWeight: 600 }}>
              Know what you need? Get an exact shopping list with our free calculator.
            </p>
            <Link
              href={calc.href}
              style={{ background: "#1B4332", color: "#fff", borderRadius: 10, padding: "0.5rem 1.1rem", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}
            >
              {calc.label} &rarr;
            </Link>
          </div>
        )}

        {/* Products */}
        {article.products && article.products.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Top Picks
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {article.products.map((p, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e7e3da", borderRadius: 14, padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "#1C1917", margin: 0, marginBottom: "0.3rem", fontSize: "0.95rem" }}>
                        {p.name}
                      </p>
                      {p.description && (
                        <p style={{ fontSize: "0.875rem", color: "#78716c", margin: 0, marginBottom: "0.5rem", lineHeight: 1.5 }}>
                          {p.description}
                        </p>
                      )}
                      {p.note && (
                        <p style={{ fontSize: "0.72rem", color: "#a8a29e", margin: 0 }}>{p.note}</p>
                      )}
                    </div>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      style={{ background: "#1B4332", color: "#fff", borderRadius: 8, padding: "0.45rem 0.9rem", textDecoration: "none", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Shop &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MDX body */}
        <div style={{ fontSize: "1rem", lineHeight: 1.75, color: "#1C1917" }} className="prose-buildguiders">
          <MDXRemote source={article.content} />
        </div>

        {/* Calculator CTA — bottom */}
        {calc && (
          <div style={{ background: "#1B4332", borderRadius: 16, padding: "1.5rem 1.75rem", marginTop: "3rem", textAlign: "center" }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", margin: 0, marginBottom: "0.75rem" }}>
              Ready to buy? Get an exact list — every item, every quantity.
            </p>
            <Link
              href={calc.href}
              style={{ background: "#FEFBF3", color: "#1B4332", borderRadius: 10, padding: "0.65rem 1.5rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 800, display: "inline-block" }}
            >
              {calc.label} &rarr;
            </Link>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #e7e3da", padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "#a8a29e" }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>BuildGuiders.com</Link>
        {" · "}
        <Link href="/guides" style={{ color: "inherit", textDecoration: "none" }}>Guides</Link>
        {" · "}
        <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
        {" · "}
        <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
      </footer>
    </div>
  );
}
