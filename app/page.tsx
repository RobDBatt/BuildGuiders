"use client";

const buildCalculators = [
  {
    emoji: "🖌️",
    title: "Paint Calculator",
    description: "Gallons, primer, rollers, tape — the full kit. Never under-buy or make a second run.",
    href: "/paint-calculator",
    status: "live",
    tag: "Live",
  },
  {
    emoji: "🪵",
    title: "Flooring Calculator",
    description: "Square footage, waste factor, underlayment, and transition strips — all in one list.",
    href: "/flooring-calculator",
    status: "live",
  },
  {
    emoji: "🔲",
    title: "Tile Calculator",
    description: "Floor or wall tile with grout lines, adhesive, and the tools everyone forgets.",
    href: "/tile-calculator",
    status: "live",
  },
  {
    emoji: "🪚",
    title: "Deck Calculator",
    description: "Decking boards, joists, post concrete, and every piece of hardware for a solid build.",
    href: "/deck-calculator",
    status: "live",
  },
  {
    emoji: "🧱",
    title: "Drywall Calculator",
    description: "Sheet count, joint compound, tape, screws — the full mudding kit.",
    href: "/drywall-calculator",
    status: "live",
  },
  {
    emoji: "🌿",
    title: "Mulch & Topsoil",
    description: "Cubic yards or bags for any bed depth. Landscape fabric and edging included.",
    href: "/mulch-calculator",
    status: "live",
  },
  {
    emoji: "🏗️",
    title: "Concrete Calculator",
    description: "Slabs, footings, or post holes. Bags or yards — plus your mixing tools.",
    href: "/concrete-calculator",
    status: "live",
  },
  {
    emoji: "🪟",
    title: "Fence Calculator",
    description: "Posts, panels, concrete, post caps, and gate hardware for any fence run.",
    href: "/fence-calculator",
    status: "live",
  },
];

const maintenanceCalculators = [
  {
    emoji: "🖌️",
    title: "Deck Stain Calculator",
    description: "How many gallons you actually need — including railings. The part everyone under-buys.",
    href: "/deck-stain-calculator",
    status: "live",
    tag: "New",
  },
];

const lawnGardenCalculators = [
  {
    emoji: "🌱",
    title: "Grass Seed Calculator",
    description: "Pounds of seed, starter fertilizer, and straw cover — for new lawns, overseeding, or patch repair.",
    href: "/grass-seed-calculator",
    status: "live",
    tag: "New",
  },
  {
    emoji: "🥕",
    title: "Raised Garden Bed Soil",
    description: "Bags of soil, compost, and perlite to fill any raised bed. Premix or 60/30/10 DIY mix.",
    href: "/raised-garden-bed-calculator",
    status: "live",
    tag: "New",
  },
];

const interiorCalculators = [
  {
    emoji: "🌸",
    title: "Wallpaper Calculator",
    description: "Rolls, paste, and tools — peel-and-stick, pre-pasted, or traditional. Pattern repeat waste included.",
    href: "/wallpaper-calculator",
    status: "live",
    tag: "New",
  },
];

const steps = [
  {
    num: "01",
    title: "Enter your dimensions",
    body: "Length, width, height. Add multiple rooms or sections if needed. Takes 30 seconds.",
  },
  {
    num: "02",
    title: "Get the exact count",
    body: "Waste factor built in. We round up correctly. No guessing, no rounding down.",
  },
  {
    num: "03",
    title: "Walk out with a list",
    body: "Every item you need — Amazon, Home Depot, and Menards links — including the stuff you'd forget.",
  },
];

const whyItems = [
  {
    icon: "🛒",
    title: "Lists, not just numbers",
    body: "We tell you the gallons, the primer, the rollers, the tape. Everything that goes in the cart.",
  },
  {
    icon: "📐",
    title: "Waste factor built in",
    body: "Cuts waste material. Odd-shaped rooms need extra. It's already accounted for.",
  },
  {
    icon: "📋",
    title: "Copy it, go",
    body: "One tap copies your whole list as plain text. Paste in Notes or text it to whoever's making the run.",
  },
  {
    icon: "📱",
    title: "Works in the aisle",
    body: "Mobile first. Pull it up standing in the store and get your answer in 30 seconds.",
  },
];

// ── Colors (inline styles to avoid Tailwind JIT issues) ──────────────────────
const GREEN = "#1B4332";
const GREEN_DARK = "#14532d";
const AMBER = "#D97706";
const CREAM = "#FEFBF3";
const INK = "#1C1917";
const MENARDS_RED = "#ED1C24";
const HD_ORANGE = "#F96302";
const AMAZON_ORANGE = "#FF9900";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans', sans-serif", color: INK }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { display:inline-flex;align-items:center;gap:8px;background:${GREEN};color:#fff;font-weight:700;font-size:14px;padding:13px 26px;border-radius:6px;text-decoration:none;border:2.5px solid ${GREEN};transition:all 0.18s cubic-bezier(.34,1.56,.64,1);cursor:pointer;font-family:inherit; }
        .btn-primary:hover { transform:translateY(-2px) scale(1.02);box-shadow:0 8px 20px rgba(27,67,50,0.35);background:${GREEN_DARK};border-color:${GREEN_DARK}; }
        .btn-primary:active { transform:scale(0.98); }
        .btn-secondary { display:inline-flex;align-items:center;gap:8px;background:${CREAM};color:${INK};font-weight:700;font-size:14px;padding:13px 26px;border-radius:6px;text-decoration:none;border:2.5px solid ${INK};transition:all 0.18s cubic-bezier(.34,1.56,.64,1);cursor:pointer;font-family:inherit; }
        .btn-secondary:hover { transform:translateY(-2px) scale(1.02);box-shadow:0 8px 20px rgba(28,25,23,0.15);background:${INK};color:${CREAM}; }
        .btn-secondary:active { transform:scale(0.97); }
        .btn-cta { display:inline-flex;align-items:center;gap:8px;background:${INK};color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:6px;text-decoration:none;border:2.5px solid ${INK};transition:all 0.18s cubic-bezier(.34,1.56,.64,1);cursor:pointer;font-family:inherit; }
        .btn-cta:hover { transform:translateY(-3px) scale(1.03);box-shadow:0 10px 24px rgba(28,25,23,0.3); }
        .btn-cta:active { transform:scale(0.97); }
        .calc-card { background:#fff;border:2px solid #E7E5E4;border-radius:8px;padding:14px;position:relative;transition:all 0.2s cubic-bezier(.34,1.56,.64,1);display:block;text-decoration:none;color:inherit; }
        .calc-card.live { border-color:${GREEN};cursor:pointer; }
        .calc-card.live:hover { transform:translateY(-4px) rotate(-0.5deg);box-shadow:4px 6px 0px ${GREEN};background:#F0FDF4; }
        .calc-card.soon { opacity:0.6;cursor:default; }
        .calc-icon { font-size:24px;margin-bottom:10px;display:block;transition:transform 0.2s cubic-bezier(.34,1.56,.64,1); }
        .calc-card:hover .calc-icon { transform:scale(1.2) rotate(-5deg); }
        .calc-link { display:inline-flex;align-items:center;gap:4px;margin-top:10px;font-size:11px;font-weight:700;color:${GREEN};text-decoration:none;transition:gap 0.15s; }
        .calc-card:hover .calc-link { gap:7px; }
        .why-card { background:#fff;border:2px solid #E7E5E4;border-radius:8px;padding:16px;transition:all 0.2s cubic-bezier(.34,1.56,.64,1); }
        .why-card:hover { transform:translateY(-3px);box-shadow:3px 4px 0 ${AMBER};border-color:${AMBER}; }
        .why-icon { font-size:22px;margin-bottom:8px;display:block;transition:transform 0.2s cubic-bezier(.34,1.56,.64,1); }
        .why-card:hover .why-icon { transform:scale(1.2) rotate(5deg); }
        .step { display:flex;align-items:flex-start;gap:16px;padding:18px 0;border-bottom:1px solid #292524;transition:background 0.15s; }
        .step:last-child { border-bottom:none; }
        .step-num { font-family:'Fraunces',serif;font-size:52px;font-weight:900;color:#86efac;line-height:1;flex-shrink:0;width:56px;transition:transform 0.2s cubic-bezier(.34,1.56,.64,1); }
        .step:hover .step-num { transform:scale(1.1) rotate(-3deg); }
        .nav-link { color:#fff;font-size:13px;font-weight:600;text-decoration:none;opacity:0.85;transition:opacity 0.15s; }
        .nav-link:hover { opacity:1; }
        .amber-bar { height:5px;background:linear-gradient(90deg,${AMBER},#F59E0B,${AMBER});background-size:200% 100%;animation:shimmer 3s ease-in-out infinite; }
        .eyebrow-dot { width:7px;height:7px;background:#86efac;border-radius:50%;animation:pulse 1.8s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)} }
        .strip-check { color:#86efac;font-size:14px;font-weight:700; }
      `}</style>

      {/* ── Nav ── */}
      <header style={{ background: GREEN, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textDecoration: "none" }}>
          Build<span style={{ color: "#86efac" }}>Guiders</span>
        </a>
        <nav style={{ display: "flex", gap: 20 }}>
          <a href="#calculators" className="nav-link">Calculators</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="/about" className="nav-link">About</a>
        </nav>
      </header>
      <div className="amber-bar" />

      {/* ── Hero ── */}
      <section style={{ background: CREAM, padding: "52px 24px 44px", borderBottom: `2.5px solid ${INK}`, position: "relative", overflow: "hidden" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 300, fontWeight: 900, color: GREEN, opacity: 0.05, position: "absolute", right: -10, top: -50, lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
          1
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GREEN, borderRadius: 4, padding: "5px 12px", marginBottom: 18 }}>
          <div className="eyebrow-dot" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.09em" }}>
            Free — No signup — Works in-store
          </span>
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(42px, 8vw, 58px)", fontWeight: 900, lineHeight: 1.0, color: INK, marginBottom: 10, letterSpacing: "-2.5px" }}>
          Make one trip.<br />
          <em style={{ fontStyle: "italic", color: GREEN }}>Not four.</em>
        </h1>
        <p style={{ fontSize: 16, color: "#57534E", lineHeight: 1.65, maxWidth: 400, marginBottom: 30 }}>
          Enter your dimensions, get your exact materials list. Every item. Every quantity. Every link — before you leave the house.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/paint-calculator" className="btn-primary">🖌️ Paint calculator</a>
          <a href="#calculators" className="btn-secondary">See all calculators</a>
        </div>
      </section>

      {/* ── Strip ── */}
      <div style={{ background: GREEN, padding: "11px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {["Waste factor included", "Full shopping list output", "Amazon + Home Depot + Menards", "Copy list to clipboard"].map(item => (
          <div key={item} style={{ color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: 0.95 }}>
            <span className="strip-check">✓</span> {item}
          </div>
        ))}
      </div>

      {/* ── Calculators ── */}
      <section id="calculators" style={{ padding: "44px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Build Calculators
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 24 }}>
          Pick your project
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 40 }}>
          {buildCalculators.map(({ emoji, title, description, href, status, tag }) => (
            <a
              key={title}
              href={status === "live" ? href : undefined}
              className={`calc-card ${status}`}
            >
              {tag && (
                <div style={{ position: "absolute", top: 10, right: 10, background: GREEN, color: "#fff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 7px", borderRadius: 3 }}>
                  {tag}
                </div>
              )}
              {status === "soon" && (
                <div style={{ position: "absolute", top: 10, right: 10, background: "#E7E5E4", color: "#A8A29E", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 7px", borderRadius: 3 }}>
                  Soon
                </div>
              )}
              <span className="calc-icon">{emoji}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#78716C", lineHeight: 1.45 }}>{description}</div>
              {status === "live" && (
                <span className="calc-link">Calculate now →</span>
              )}
            </a>
          ))}
        </div>

        {/* Maintenance calculators */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Maintenance Calculators
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
          Keep it looking good
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 40 }}>
          {maintenanceCalculators.map(({ emoji, title, description, href, status, tag }) => (
            <a
              key={title}
              href={status === "live" ? href : undefined}
              className={`calc-card ${status}`}
            >
              {tag && (
                <div style={{ position: "absolute", top: 10, right: 10, background: "#1d4ed8", color: "#fff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 7px", borderRadius: 3 }}>
                  {tag}
                </div>
              )}
              <span className="calc-icon">{emoji}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#78716C", lineHeight: 1.45 }}>{description}</div>
              {status === "live" && (
                <span className="calc-link">Calculate now →</span>
              )}
            </a>
          ))}
        </div>

        {/* Lawn & Garden calculators */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Lawn &amp; Garden Calculators
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
          Grow something great
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 40 }}>
          {lawnGardenCalculators.map(({ emoji, title, description, href, status, tag }) => (
            <a key={title} href={status === "live" ? href : undefined} className={`calc-card ${status}`}>
              {tag && (
                <div style={{ position: "absolute", top: 10, right: 10, background: GREEN, color: "#fff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 7px", borderRadius: 3 }}>
                  {tag}
                </div>
              )}
              <span className="calc-icon">{emoji}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#78716C", lineHeight: 1.45 }}>{description}</div>
              {status === "live" && <span className="calc-link">Calculate now →</span>}
            </a>
          ))}
        </div>

        {/* Interior calculators */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Interior Calculators
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
          Finish the inside
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {interiorCalculators.map(({ emoji, title, description, href, status, tag }) => (
            <a key={title} href={status === "live" ? href : undefined} className={`calc-card ${status}`}>
              {tag && (
                <div style={{ position: "absolute", top: 10, right: 10, background: GREEN, color: "#fff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 7px", borderRadius: 3 }}>
                  {tag}
                </div>
              )}
              <span className="calc-icon">{emoji}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#78716C", lineHeight: 1.45 }}>{description}</div>
              {status === "live" && <span className="calc-link">Calculate now →</span>}
            </a>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: `2.5px solid ${INK}` }} />

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ background: INK, padding: "44px 24px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", marginBottom: 28 }}>
          How it works
        </div>
        <div>
          {steps.map(({ num, title, body }) => (
            <div key={num} className="step">
              <div className="step-num">{num}</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
                <p style={{ fontSize: 13, color: "#D6D3D1", lineHeight: 1.65 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why BuildGuiders ── */}
      <section style={{ background: CREAM, padding: "44px 24px", borderTop: `2.5px solid ${INK}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Why BuildGuiders
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 24 }}>
          Built by someone who's<br />made that second trip.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {whyItems.map(({ icon, title, body }) => (
            <div key={title} className="why-card">
              <span className="why-icon">{icon}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>{title}</div>
              <p style={{ fontSize: 11, color: "#78716C", lineHeight: 1.55 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shopping list preview ── */}
      <section style={{ background: "#fff", padding: "44px 24px", borderTop: `2.5px solid ${INK}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#78716C", marginBottom: 4 }}>
          Shopping list output
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 6 }}>
          What you actually get
        </div>
        <p style={{ fontSize: 14, color: "#57534E", marginBottom: 20 }}>Every item on your list has three purchase options — pick your store.</p>
        <div style={{ background: "#FAFAF8", border: `2px solid #E7E5E4`, borderRadius: 10, overflow: "hidden", maxWidth: 480 }}>
          <div style={{ background: GREEN, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>Your Shopping List</div>
              <div style={{ fontSize: 11, color: "#86efac", marginTop: 2 }}>412 sq ft · 2 coats · everything included</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 4 }}>
              Copy list
            </div>
          </div>
          {[
            { qty: 2, name: "Interior Paint", badge: "Paint", badgeBg: "#F0FDF4", badgeColor: "#166534", note: "2 gal covers your surface area with 2 coats" },
            { qty: 1, name: "Interior Primer", badge: "Primer", badgeBg: "#EFF6FF", badgeColor: "#1e40af", note: "Seals surface for better coverage and adhesion" },
            { qty: 2, name: "Roller Covers 3/8\" nap", badge: "Tool", badgeBg: "#F5F5F4", badgeColor: "#57534E", note: "3/8\" nap for smooth walls. Use 1/2\" for textured." },
          ].map(({ qty, name, badge, badgeBg, badgeColor, note }) => (
            <div key={name} style={{ padding: "12px 16px", borderBottom: "1px solid #F5F5F4" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, background: "#F5F5F4", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{qty}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {name}
                    <span style={{ fontSize: 10, background: badgeBg, color: badgeColor, padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>{badge}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>{note}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 42, flexWrap: "wrap" }}>
                {[
                  { label: "Amazon", bg: AMAZON_ORANGE },
                  { label: "Home Depot", bg: HD_ORANGE },
                  { label: "Menards", bg: MENARDS_RED },
                ].map(({ label, bg }) => (
                  <div key={label} style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, color: "#fff", background: bg, cursor: "pointer" }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: AMBER, padding: "40px 24px", textAlign: "center", borderTop: `2.5px solid ${INK}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 8 }}>
          Ready to stop guessing?
        </div>
        <p style={{ fontSize: 14, color: INK, opacity: 0.75, marginBottom: 24 }}>Free, fast, no signup required.</p>
        <a href="/paint-calculator" className="btn-cta">🖌️ Calculate my paint</a>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: INK, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `3px solid ${AMBER}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 900, color: "#fff" }}>
        BuildGuiders.com
        </div>
        <div style={{ display: "flex", gap: 20 }}>
        <a href="/#calculators" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Calculators</a>
          <a href="/about" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>About</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Privacy</a>
          <a href="mailto:GuidersNetwork@gmail.com" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
