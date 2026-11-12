import type { Metadata } from "next";
import { PROBLEMS, type Line, type Source } from "@/lib/deck-stain-problems";

// A server component on purpose (AGENTS.md §7): every symptom, check and fix
// is in the HTML on first load. The tiles are anchor links, not a wizard, so
// nothing a crawler needs sits behind a click.

const GREEN = "#1B4332";
const AMBER = "#D97706";
const INK = "#1C1917";
const CREAM = "#FEFBF3";
const MUTED = "#57534E";

const TITLE = "Deck Stain Problems: Find the Cause and Fix";
const DESCRIPTION =
  "Blotchy, tacky, peeling or too dark? Match what your deck stain is doing to its likely cause, with fixes from least to most drastic.";
const URL = "https://www.buildguiders.com/deck-stain-problems";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: `${TITLE} | BuildGuiders`,
    description: DESCRIPTION,
    url: URL,
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

function Cite({ source }: { source?: Source }) {
  if (source === undefined) return null;
  return (
    <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 4 }}>
      {source === null ? (
        "Source: not published by any manufacturer we checked"
      ) : (
        <>
          Source: <a href={source.url}>{source.name}</a>
        </>
      )}
    </span>
  );
}

function LineText({ line }: { line: Line }) {
  return (
    <>
      {line.text}
      <Cite source={line.source} />
    </>
  );
}

export default function DeckStainProblemsPage() {
  const sources = new Map<string, NonNullable<Source>>();
  for (const p of PROBLEMS) {
    for (const l of [...p.checks.map((c) => c.cause), ...p.fixes, ...(p.note ? [p.note] : [])]) {
      if (l.source) sources.set(l.source.url, l.source);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans', sans-serif", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { color:#fff;font-size:13px;font-weight:600;text-decoration:none;opacity:0.85;transition:opacity 0.15s; }
        .nav-link:hover { opacity:1; }
        .amber-bar { height:5px;background:linear-gradient(90deg,${AMBER},#F59E0B,${AMBER}); }
        a { color: ${GREEN}; }
        a:hover { text-decoration: underline; }
        .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
        .tile { display:block; background:#fff; border:2px solid ${INK}; border-radius:6px; padding:14px 16px; font-weight:700; text-decoration:none; color:${INK}; }
        .tile:hover { background:#F0FDF4; text-decoration:none; }
        section { scroll-margin-top: 16px; }
        ul.checks, ol.fixes { padding-left: 20px; display:flex; flex-direction:column; gap:12px; font-size:16px; line-height:1.65; color:#44403C; }
      `}</style>

      <header style={{ background: GREEN }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <nav style={{ display: "flex", gap: 20 }}>
            <a href="/guides" className="nav-link">Guides</a>
            <a href="/calculators" className="nav-link">Calculators</a>
          </nav>
        </div>
        <div className="amber-bar" />
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "44px 24px 64px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(32px, 5.5vw, 46px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1.5px", marginBottom: 16 }}>
          Deck stain problems: find the cause and the fix
        </h1>
        <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.7, marginBottom: 28 }}>
          Pick what your deck is doing. Each section gives a quick check to tell the causes apart, then the fixes in
          order from least to most drastic, with a link to the full guide. Figures are attributed to the manufacturer
          or the USDA Forest Products Laboratory, and the sources are listed at the bottom.
        </p>

        <nav aria-label="Symptoms" className="tiles" style={{ marginBottom: 48 }}>
          {PROBLEMS.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="tile">
              {p.symptom}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {PROBLEMS.map((p) => (
            <section key={p.id} id={p.id}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, letterSpacing: "-0.8px", marginBottom: 10 }}>
                {p.symptom}
              </h2>
              <p style={{ fontSize: 16, color: "#44403C", lineHeight: 1.7, marginBottom: 20 }}>{p.summary}</p>

              <h3 style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: GREEN, marginBottom: 10 }}>
                Quick check
              </h3>
              <ul className="checks" style={{ marginBottom: 24 }}>
                {p.checks.map((c) => (
                  <li key={c.sign}>
                    <strong>{c.sign}:</strong> <LineText line={c.cause} />
                  </li>
                ))}
              </ul>

              <h3 style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: GREEN, marginBottom: 10 }}>
                Fixes, least drastic first
              </h3>
              <ol className="fixes" style={{ marginBottom: 20 }}>
                {p.fixes.map((f) => (
                  <li key={f.text}>
                    <LineText line={f} />
                  </li>
                ))}
              </ol>

              {p.note && (
                <p style={{ fontSize: 15, color: "#44403C", lineHeight: 1.65, background: "#fff", borderLeft: `4px solid ${AMBER}`, padding: "12px 16px", marginBottom: 20 }}>
                  <LineText line={p.note} />
                </p>
              )}

              <p style={{ fontSize: 16, fontWeight: 700 }}>
                Full guide: <a href={`/guides/${p.guide.slug}`}>{p.guide.label}</a>
              </p>
            </section>
          ))}
        </div>

        <section style={{ marginTop: 56, paddingTop: 28, borderTop: "1px solid #e7e3da" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Before you buy for the redo</h2>
          <p style={{ fontSize: 16, color: "#44403C", lineHeight: 1.7 }}>
            Most of these problems start with too much stain. Run your deck through the free{" "}
            <a href="/deck-stain-calculator">deck stain calculator</a> so the gallons match the spread rate on the can
            instead of a guess.
          </p>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Sources</h2>
          <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.7, color: "#44403C" }}>
            {[...sources.values()].map((s) => (
              <li key={s.url}>
                <a href={s.url}>{s.name}</a>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 14, color: MUTED, marginTop: 12 }}>
            Researched and compared by the BuildGuiders team from manufacturer data and published research; see{" "}
            <a href="/about">how we research</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
