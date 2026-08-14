import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buying Guides — Material Picks",
  description:
    "Expert buying guides for paint, flooring, deck stain, drywall, and more — with calculator links so you know exactly how much to buy.",
  alternates: { canonical: "https://www.buildguiders.com/guides" },
};

const CATEGORY_LABELS: Record<string, string> = {
  paint: "Paint",
  flooring: "Flooring",
  tile: "Tile",
  deck: "Deck",
  drywall: "Drywall",
  landscaping: "Landscaping",
  concrete: "Concrete",
  fence: "Fence",
  "stain-sealer": "Stain & Sealer",
};

export default async function GuidesPage() {
  const articles = getAllArticles();

  return (
    <div style={{ background: "#FEFBF3", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "#FEFBF3", borderBottom: "1px solid #e7e3da", padding: "0 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
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

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1C1917", marginBottom: "0.5rem", lineHeight: 1.2 }}>
            Buying Guides
          </h1>
          <p style={{ color: "#78716c", fontSize: "1rem", maxWidth: 540 }}>
            Pick the right materials before you calculate. Every guide ends with a link to the free calculator so you know exactly how much to buy.
          </p>
        </div>

        {articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#a8a29e" }}>
            <p style={{ fontSize: "1.1rem" }}>Guides coming soon.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/guides/${article.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div className="guide-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      {article.category && CATEGORY_LABELS[article.category] && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#1B4332",
                            background: "#d1fae5",
                            borderRadius: 6,
                            padding: "0.15rem 0.5rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {CATEGORY_LABELS[article.category]}
                        </span>
                      )}
                    </div>
                    <h2
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#1C1917",
                        margin: 0,
                        marginBottom: "0.3rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {article.title}
                    </h2>
                    {article.description && (
                      <p style={{ fontSize: "0.875rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
                        {article.description}
                      </p>
                    )}
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
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
