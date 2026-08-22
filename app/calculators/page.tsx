import type { Metadata } from "next";
import { calculatorGroups, allCalculators } from "@/lib/calculators";

const GREEN = "#1B4332";
const AMBER = "#D97706";
const INK = "#1C1917";
const CREAM = "#FEFBF3";

// Rendered title is "%s | BuildGuiders" (15 chars of suffix), so this stays
// under the 60-char SERP limit at 48.
export const metadata: Metadata = {
  title: "Home Project Material Calculators",
  description:
    "Every BuildGuiders material calculator in one place — paint, flooring, tile, deck, drywall, concrete, roof and more. Each one ends in a shopping list.",
  alternates: { canonical: "https://www.buildguiders.com/calculators" },
  openGraph: {
    title: "Home Project Material Calculators",
    description:
      "Every BuildGuiders material calculator in one place. Enter your dimensions, get the exact counts and a shopping list you can take to the store.",
    url: "https://www.buildguiders.com/calculators",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

// A plain server component: the whole value of this page is the list itself, so
// it has to be in the server-rendered HTML rather than behind any interaction.
export default function CalculatorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans', sans-serif", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { color:#fff;font-size:13px;font-weight:600;text-decoration:none;opacity:0.85;transition:opacity 0.15s; }
        .nav-link:hover { opacity:1; }
        .amber-bar { height:5px;background:linear-gradient(90deg,${AMBER},#F59E0B,${AMBER});background-size:200% 100%;animation:shimmer 3s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        .calc-card {
          position:relative;display:block;background:#fff;border:2.5px solid ${INK};border-radius:8px;
          padding:16px 14px;text-decoration:none;color:${INK};
          transition:transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s, background 0.18s;
        }
        .calc-card:hover { transform:translateY(-4px) rotate(-0.5deg);box-shadow:4px 6px 0px ${GREEN};background:#F0FDF4;border-color:${GREEN}; }
        .calc-tag {
          position:absolute;top:-9px;right:10px;background:${AMBER};color:#fff;font-size:9px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.08em;padding:3px 7px;border-radius:3px;
        }
        .calc-link { display:inline-flex;align-items:center;gap:4px;margin-top:10px;font-size:11px;font-weight:700;color:${GREEN};text-decoration:none;transition:gap 0.15s; }
        .calc-card:hover .calc-link { gap:9px; }
      `}</style>

      {/* Nav */}
      <header style={{ background: GREEN }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <nav style={{ display: "flex", gap: 20 }}>
            <a href="/calculators" className="nav-link">Calculators</a>
            <a href="/guides" className="nav-link">Guides</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
        </div>
        <div className="amber-bar" />
      </header>

      {/* Hero */}
      <div style={{ borderBottom: `2.5px solid ${INK}`, background: "#fff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "52px 24px 40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GREEN, borderRadius: 4, padding: "5px 12px", marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.09em" }}>
              {allCalculators.length} free calculators
            </span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(34px, 6vw, 50px)", fontWeight: 900, lineHeight: 1.02, color: INK, letterSpacing: "-2px", marginBottom: 16 }}>
            Work out what to buy,<br />
            <em style={{ fontStyle: "italic", color: GREEN }}>before you buy it.</em>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#57534E", maxWidth: 620 }}>
            Every calculator takes your dimensions and returns the actual counts — with the
            waste factor already in — then hands you a shopping list including the bits people
            forget. No sign-up, no email.
          </p>
        </div>
      </div>

      {/* Groups */}
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "44px 24px 56px" }}>
        {calculatorGroups.map(({ eyebrow, heading, items }) => (
          <section key={eyebrow} style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
              {eyebrow}
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 20 }}>
              {heading}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {items.map(({ emoji, title, description, href, tag }) => (
                <a key={href} href={href} className="calc-card">
                  {tag && <span className="calc-tag">{tag}</span>}
                  <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 10 }} aria-hidden="true">{emoji}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 6 }}>
                    {title}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "#57534E" }}>{description}</p>
                  <span className="calc-link">Open calculator →</span>
                </a>
              ))}
            </div>
          </section>
        ))}

        <section style={{ borderTop: `2.5px solid ${INK}`, paddingTop: 28 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 27px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 10 }}>
            Not sure how much you need?
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "#57534E", maxWidth: 620, marginBottom: 14 }}>
            The <a href="/guides" style={{ color: GREEN, fontWeight: 700 }}>guides</a> cover which
            product to pick — paint, decking, stain, tile — and each one ends with the calculator
            that tells you how much of it to get.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: INK, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `3px solid ${AMBER}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 900, color: "#fff" }}>BuildGuiders.com</div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Home</a>
          <a href="/calculators" style={{ fontSize: 13, color: "#86efac", textDecoration: "none" }}>Calculators</a>
          <a href="/guides" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Guides</a>
          <a href="/about" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>About</a>
        </div>
      </footer>
    </div>
  );
}
