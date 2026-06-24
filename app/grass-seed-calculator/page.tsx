"use client";
import { useState, useMemo } from "react";

const GREEN = "#1B4332";
const AMAZON_TAG = "buildguiders-20";
const aUrl = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const SEED_TYPES = [
  { id: "new",      label: "New Lawn",      rate: 5, desc: "5 lbs per 1,000 sq ft" },
  { id: "overseed", label: "Overseeding",   rate: 3, desc: "3 lbs per 1,000 sq ft" },
  { id: "repair",   label: "Bare Patches",  rate: 4, desc: "4 lbs per 1,000 sq ft" },
];

const SUN_TYPES = [
  { id: "sun",   label: "Full Sun (6+ hrs/day)",  query: "full sun grass seed Scotts Pennington" },
  { id: "shade", label: "Shade (< 4 hrs/day)",    query: "shade grass seed tall fescue" },
  { id: "mixed", label: "Mixed Sun / Shade",      query: "sun shade grass seed mix" },
];

function calc(sqft: number, rate: number) {
  const lbs       = (sqft / 1000) * rate;
  const bags7     = Math.ceil(lbs / 7);           // 7-lb bags (common Scotts / Pennington size)
  const fertBags  = Math.max(1, Math.ceil(sqft / 5000)); // starter fert covers 5,000 sq ft per bag
  const strawBags = Math.ceil(sqft / 250);         // seed accelerator mulch, ~250 sq ft per bag
  return {
    lbs:       Math.round(lbs * 10) / 10,
    bags7,
    fertBags,
    strawBags,
  };
}

export default function GrassSeedCalculator() {
  const [length,   setLength]   = useState("");
  const [width,    setWidth]    = useState("");
  const [seedType, setSeedType] = useState("new");
  const [sunType,  setSunType]  = useState("sun");
  const [calculated, setCalculated] = useState(false);

  const sqft    = (parseFloat(length) || 0) * (parseFloat(width) || 0);
  const hasInput = sqft > 0;
  const st  = SEED_TYPES.find(s => s.id === seedType)!;
  const sun = SUN_TYPES.find(s => s.id === sunType)!;
  const result = useMemo(() => calc(sqft, st.rate), [sqft, st.rate]);

  const shoppingItems = [
    {
      qty:  result.bags7,
      name: `Grass Seed — ${sun.label} (7-lb bags)`,
      note: `${result.lbs} lbs needed · ${result.bags7} × 7-lb bag${result.bags7 !== 1 ? "s" : ""}`,
      tip:  seedType === "new"
        ? "Tip: Rake soil to ¼\" depth before seeding. Seed-to-soil contact is the #1 factor in germination."
        : seedType === "overseed"
        ? "Tip: Mow existing lawn short (2\") before overseeding. Dethatch if thatch exceeds ½\"."
        : "Tip: Loosen bare soil 2–3\" deep before applying seed and press lightly — don't bury.",
      amazon: aUrl(sun.query),
    },
    {
      qty:  result.fertBags,
      name: "Starter Fertilizer for New Grass",
      note: `${result.fertBags} bag${result.fertBags !== 1 ? "s" : ""} — feeds seedlings for the first 6 weeks`,
      tip:  "Tip: Never use standard lawn fertilizer on new seed — high nitrogen burns seedlings. Use starter formula only.",
      amazon: aUrl("starter fertilizer new grass seed lawn"),
    },
    ...(seedType === "new" ? [{
      qty:  result.strawBags,
      name: "Seed Accelerator Straw Mulch",
      note: `Locks in moisture and protects seed from washing away — especially on slopes`,
      tip:  "Tip: Apply a thin, even layer — just enough to see 50% of the soil through it. Too thick and seed can't emerge.",
      amazon: aUrl("grass seed accelerator straw mulch EZ seed"),
    }] : []),
    {
      qty:  1,
      name: "Bow Rake (16-tine)",
      note: "For breaking up soil crust, working seed into the surface, and leveling topdressing",
      amazon: aUrl("bow rake garden 16 tine"),
    },
    {
      qty:  1,
      name: "Oscillating Lawn Sprinkler",
      note: "New seed needs light watering twice daily for 2–3 weeks. Covers 3,000–4,000 sq ft.",
      tip:  "Tip: Water lightly and frequently until germination — keep the top ½\" moist, not soggy.",
      amazon: aUrl("oscillating lawn sprinkler adjustable"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>

      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Guides</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🌱</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grass Seed Calculator</h1>
              <p className="text-slate-500 mt-1">Pounds of seed, starter fertilizer, and supplies — for new lawns, overseeding, or bare patch repair.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Controls ── */}
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Seeding Type</h2>
              </div>
              <div className="p-4 space-y-2">
                {SEED_TYPES.map(s => (
                  <button key={s.id} onClick={() => setSeedType(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={seedType === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Sun Condition</h2>
              </div>
              <div className="p-4 space-y-2">
                {SUN_TYPES.map(s => (
                  <button key={s.id} onClick={() => setSunType(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={sunType === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Lawn Area</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {([["Length (ft)", length, setLength], ["Width (ft)", width, setWidth]] as const).map(([label, val, setter]) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                    <input type="number" min="0" placeholder="0" value={val}
                      onChange={e => setter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                      onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`}
                      onBlur={e => e.target.style.boxShadow = "none"}
                      style={{ outline: "none" }} />
                  </div>
                ))}
              </div>
              {sqft > 0 && <p className="px-4 pb-3 text-xs text-slate-400">{sqft.toLocaleString()} sq ft total</p>}
            </div>

            <button onClick={() => setCalculated(true)} disabled={!hasInput}
              className="w-full py-3.5 text-white font-bold rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GREEN; }}>
              Calculate & Build My List →
            </button>
          </div>

          {/* ── Results ── */}
          <div className="lg:col-span-3 space-y-4">
            {!calculated || !hasInput ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your lawn dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Lawn area</div>
                      <div className="text-3xl font-black">{sqft.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-3xl font-black">{result.lbs}</div>
                        <div className="text-xs text-green-300">lbs of seed</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black">{result.bags7}</div>
                        <div className="text-xs text-green-300">bags (7 lb)</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {st.label} — {st.rate} lbs per 1,000 sq ft · {sun.label}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-800">Your Shopping List</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shoppingItems.map(item => (
                      <div key={item.name} className="px-5 py-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-800">{item.qty}</div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                            <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                            {item.tip && <p className="text-xs text-amber-600 mt-1">{item.tip}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-11">
                          <a href={item.amazon} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-white text-xs font-bold rounded-lg"
                            style={{ backgroundColor: "#FF9900" }}>Amazon</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 BuildGuiders.com</p>
          <p className="text-xs text-slate-300">Earns from qualifying purchases via Amazon Associates.</p>
        </div>
      </footer>
    </div>
  );
}
