const GREEN = "#1B4332";
const AMBER = "#D97706";
const INK = "#1C1917";
const CREAM = "#FEFBF3";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans', sans-serif", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { color:#fff;font-size:13px;font-weight:600;text-decoration:none;opacity:0.85;transition:opacity 0.15s; }
        .nav-link:hover { opacity:1; }
        .amber-bar { height:5px;background:linear-gradient(90deg,${AMBER},#F59E0B,${AMBER});background-size:200% 100%;animation:shimmer 3s ease-in-out infinite; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        a { color: ${GREEN}; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Nav */}
      <header style={{ background: GREEN }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <nav style={{ display: "flex", gap: 20 }}>
            <a href="/#calculators" className="nav-link">Calculators</a>
            <a href="/#how-it-works" className="nav-link">How it works</a>
          </nav>
        </div>
        <div className="amber-bar" />
      </header>

      {/* Hero */}
      <div style={{ borderBottom: `2.5px solid ${INK}`, background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 24px 44px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GREEN, borderRadius: 4, padding: "5px 12px", marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.09em" }}>About BuildGuiders</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 900, lineHeight: 1.0, color: INK, letterSpacing: "-2px", marginBottom: 16 }}>
            Built by someone who's<br />
            <em style={{ fontStyle: "italic", color: GREEN }}>made that second trip.</em>
          </h1>
          <p style={{ fontSize: 18, color: "#57534E", lineHeight: 1.7, maxWidth: 560 }}>
            BuildGuiders exists because every home project has the same problem: you don't know exactly what to buy until you're standing in the store, and by then it's too late to do the math.
          </p>
        </div>
      </div>

      {/* Story */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* The story */}
          <section>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
              The second trip problem
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 16, color: "#44403C", lineHeight: 1.75 }}>
              <p>
                You spend a Saturday morning measuring every wall. You drive to Home Depot. You grab what you think is enough paint. You get home, get two-thirds done, and run out. Back to the store — only to find the lot number is different and the color won't match perfectly. You finish anyway. You can see it for the next three years every time the light hits that wall a certain way.
              </p>
              <p>
                Or you overbuy. You end up with four extra gallons of paint in a color you'll never use again sitting in your garage until someone tells you the county has a paint disposal day once a year.
              </p>
              <p>
                Neither outcome is acceptable. Both happen constantly. And they happen because the math isn't hard — it's just that nobody does it before leaving the house.
              </p>
              <p>
                BuildGuiders does the math. You put in dimensions, we give you a list. Not a number — a list. The paint, the primer, the roller covers in the right nap size for your wall texture, the tape, the drop cloth, the extension pole you always forget. Everything that goes in the cart before you leave the driveway.
              </p>
            </div>
          </section>

          {/* What makes it different */}
          <section>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 20 }}>
              What makes this different
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: "🛒",
                  title: "Shopping lists, not just numbers",
                  body: "Every other calculator tells you how many gallons. We tell you the gallons, the primer, the rollers, the tape, and the stuff you'd forget. Everything that goes in the cart."
                },
                {
                  icon: "📐",
                  title: "Waste factor built in",
                  body: "Cuts waste material. Odd-shaped rooms need extra. Diagonal installs waste more. We account for it — results are already rounded up correctly."
                },
                {
                  icon: "🧠",
                  title: "Real-world knowledge in the tips",
                  body: "The notes on each item aren't filler. Same batch number for paint. Grout brightener before tile staining. PT lumber needs 6-12 months to dry. Things people learn the hard way."
                },
                {
                  icon: "📱",
                  title: "Works standing in the aisle",
                  body: "Designed mobile-first. Pull it up on your phone in the flooring section and get your answer in under a minute. Copy the list and text it to whoever's making the run."
                },
                {
                  icon: "🆓",
                  title: "Free, no signup, no tricks",
                  body: "There's no premium version of the calculator. There's no email wall. The tool works. That's the product. We make money through affiliate links — see below."
                },
                {
                  icon: "📏",
                  title: "Code-aware where it matters",
                  body: "The deck calculator knows about railing height requirements, ledger attachment, frost line burial depth, and permit triggers. Because we'd rather tell you before than after."
                },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{ background: "#fff", border: `2px solid #E7E5E4`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: INK, marginBottom: 8 }}>{title}</div>
                  <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6 }}>{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The Guiders family */}
          <section>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
              Part of the Guiders family
            </h2>
            <div style={{ fontSize: 16, color: "#44403C", lineHeight: 1.75, marginBottom: 20 }}>
              <p>BuildGuiders is part of a small portfolio of utility sites built to answer specific questions well:</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { name: "GadgetGuiders.com", desc: "Troubleshooting and setup guides for smart home devices and electronics" },
                { name: "GearGuiders.com", desc: "Smart home product guides and recommendations" },
                { name: "BuildGuiders.com", desc: "Material calculators for home projects — you're here" },
              ].map(({ name, desc }) => (
                <div key={name} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 16px", background: "#fff", border: `1.5px solid #E7E5E4`, borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: INK }}>{name}</div>
                    <div style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Affiliate disclosure — required by FTC, CJ, Amazon */}
          <section style={{ borderTop: `2.5px solid ${INK}`, paddingTop: 40 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: INK, letterSpacing: "-1px", marginBottom: 16 }}>
              Affiliate disclosure
            </h2>
            <div style={{ background: "#fff", border: `2px solid #E7E5E4`, borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", gap: 14, fontSize: 15, color: "#44403C", lineHeight: 1.75 }}>
              <p>
                BuildGuiders participates in the <strong>Amazon Associates Program</strong>. As an affiliate, we earn a small commission when you purchase through links on this site, at no additional cost to you.
              </p>
              <p>
                These commissions are how we keep the calculators free. They don't influence our calculations, our shopping list contents, or which items we recommend — we list what you actually need for the job, not what earns us more.
              </p>
              <p>
                We never recommend products we wouldn't buy ourselves or accept payment to feature specific brands. The affiliate links point to the most relevant products for each calculator item; you're always free to search for alternatives.
              </p>
              <p style={{ fontSize: 13, color: "#78716C" }}>
                This disclosure is made in compliance with the FTC's guidelines on endorsements and the terms of our affiliate agreements. Questions about our affiliate relationships can be directed to <a href="mailto:GuidersNetwork@gmail.com">GuidersNetwork@gmail.com</a>.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section style={{ background: INK, borderRadius: 12, padding: "36px 32px" }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", marginBottom: 10 }}>
              Get in touch
            </h2>
            <p style={{ fontSize: 15, color: "#D6D3D1", lineHeight: 1.7, marginBottom: 20 }}>
              Found a calculator that's off? Know a material we haven't covered? Affiliate program inquiry? We read everything.
            </p>
            <a
              href="mailto:GuidersNetwork@gmail.com"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: AMBER, color: INK, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}
            >
              GuidersNetwork@gmail.com
            </a>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: INK, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `3px solid ${AMBER}` }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 900, color: "#fff" }}>BuildGuiders.com</div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Home</a>
          <a href="/#calculators" style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>Calculators</a>
          <a href="/about" style={{ fontSize: 13, color: "#86efac", textDecoration: "none" }}>About</a>
        </div>
      </footer>
    </div>
  );
}
