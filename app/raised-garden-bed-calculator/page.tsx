"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
const aUrl = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const PREMIX_BAG_CUFT = 1.5;   // Miracle-Gro Raised Bed Soil
const COMPOST_BAG_CUFT = 1.0;  // standard compost bag
const PERLITE_BAG_CUFT = 0.25; // 8-qt perlite bag

const DEPTHS = [6, 8, 10, 12]; // inches

const MIX_TYPES = [
  {
    id:   "premix",
    label: "All-in-One Premix",
    desc:  "One bag does it all — easiest option",
  },
  {
    id:   "diy",
    label: "DIY Mix (60/30/10)",
    desc:  "60% soil · 30% compost · 10% perlite",
  },
];

interface Bed { id: string; length: string; width: string; }
const defaultBed = (): Bed => ({ id: crypto.randomUUID(), length: "", width: "" });

function calc(beds: Bed[], depthIn: number) {
  const depthFt  = depthIn / 12;
  const totalCuFt = beds.reduce(
    (sum, b) => sum + (parseFloat(b.length) || 0) * (parseFloat(b.width) || 0) * depthFt,
    0
  );
  const premixBags  = Math.ceil(totalCuFt / PREMIX_BAG_CUFT);
  const soilBags    = Math.ceil(totalCuFt * 0.60 / PREMIX_BAG_CUFT);
  const compostBags = Math.ceil(totalCuFt * 0.30 / COMPOST_BAG_CUFT);
  const perliteBags = Math.ceil(totalCuFt * 0.10 / PERLITE_BAG_CUFT);
  const fabricRolls = Math.ceil(
    beds.reduce((sum, b) => sum + (parseFloat(b.length) || 0) * (parseFloat(b.width) || 0), 0) / 50
  ); // landscape fabric: ~50 sq ft per roll for bottoms
  return {
    totalCuFt:   Math.round(totalCuFt * 10) / 10,
    premixBags,
    soilBags,
    compostBags,
    perliteBags,
    fabricRolls: Math.max(1, fabricRolls),
  };
}

export default function RaisedGardenBedCalculator() {
  const [beds,      setBeds]      = useState<Bed[]>([defaultBed()]);
  const [depth,     setDepth]     = useState(8);
  const [mixType,   setMixType]   = useState("premix");
  const [calculated, setCalculated] = useState(false);

  const hasInput = beds.some(b => parseFloat(b.length) > 0 && parseFloat(b.width) > 0);
  const result   = useMemo(() => calc(beds, depth), [beds, depth]);

  const premixItems = [
    {
      qty:  result.premixBags,
      name: "Raised Bed Soil Mix (1.5 cu ft bags)",
      note: `${result.premixBags} bag${result.premixBags !== 1 ? "s" : ""} fills ${result.totalCuFt} cubic feet at ${depth}\" deep`,
      tip:  "Tip: Miracle-Gro Raised Bed Soil and Kellogg Raised Bed & Potting Mix are the most widely available. Check the bag for the cu ft size — some stores stock 2 cu ft bags, which means you need fewer.",
      amazon: aUrl("raised bed soil mix Miracle-Gro garden"),
    },
    {
      qty:  Math.max(1, Math.ceil(result.premixBags / 4)),
      name: "Premium Compost Amendment (1 cu ft bags)",
      note: "Blend 20–25% compost into premix for better water retention and nutrients",
      tip:  "Tip: Premix soil alone can compact over time. Adding compost every season keeps beds productive.",
      amazon: aUrl("premium compost amendment garden organic"),
    },
  ];

  const diyItems = [
    {
      qty:  result.soilBags,
      name: "Garden / Topsoil (1.5 cu ft bags) — 60%",
      note: `${result.soilBags} bag${result.soilBags !== 1 ? "s" : ""} — forms the base of your mix`,
      tip:  "Tip: Use bagged garden soil or topsoil, not native in-ground soil — in-ground soil compacts and drains poorly in raised beds.",
      amazon: aUrl("garden topsoil bags raised bed 1.5 cu ft"),
    },
    {
      qty:  result.compostBags,
      name: "Compost (1 cu ft bags) — 30%",
      note: `${result.compostBags} bag${result.compostBags !== 1 ? "s" : ""} — feeds plants and improves water retention`,
      amazon: aUrl("compost bags garden organic amendment"),
    },
    {
      qty:  result.perliteBags,
      name: "Perlite (8-qt bags) — 10%",
      note: `${result.perliteBags} bag${result.perliteBags !== 1 ? "s" : ""} — prevents compaction and improves drainage`,
      tip:  "Tip: Perlite is especially important for root vegetables (carrots, beets, radishes) that need loose, well-draining soil.",
      amazon: aUrl("perlite garden soil amendment 8 quart"),
    },
  ];

  const commonItems = [
    {
      qty:  result.fabricRolls,
      name: "Weed Barrier Landscape Fabric",
      note: "Lines the bottom of beds to block weeds from below while allowing drainage",
      tip:  "Tip: Staple fabric to the inside of the frame, not just lay it flat — this prevents it from shifting when you fill with soil.",
      amazon: aUrl("weed barrier landscape fabric raised bed liner"),
    },
    {
      qty:  1,
      name: "Garden Gloves (heavy-duty)",
      note: "You will move a lot of bags — gloves prevent blisters and splinters from wood frames",
      amazon: aUrl("heavy duty garden gloves work"),
    },
    {
      qty:  1,
      name: "Garden Hand Trowel + Cultivator Set",
      note: "For mixing amendments, transplanting seedlings, and working soil around plants",
      amazon: aUrl("garden hand trowel cultivator set stainless"),
    },
  ];

  const shoppingItems = [...(mixType === "premix" ? premixItems : diyItems), ...commonItems];

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
            <div className="w-12 h-12 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🥕</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Raised Garden Bed Soil Calculator</h1>
              <p className="text-slate-500 mt-1">Bags of soil, compost, and amendments — for any bed size or depth.</p>
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
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Soil Mix</h2>
              </div>
              <div className="p-4 space-y-2">
                {MIX_TYPES.map(m => (
                  <button key={m.id} onClick={() => setMixType(m.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={mixType === m.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {m.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Bed Depth</h2>
              </div>
              <div className="p-4">
                <div className="flex gap-2">
                  {DEPTHS.map(d => (
                    <button key={d} onClick={() => setDepth(d)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={depth === d ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      {d}"
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">8" is standard for most vegetables. 12" for deep root crops (carrots, parsnips).</p>
              </div>
            </div>

            <div className="space-y-3">
              {beds.map((b, i) => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Bed {beds.length > 1 ? i + 1 : ""}</h2>
                    {beds.length > 1 && (
                      <button onClick={() => setBeds(prev => prev.filter(x => x.id !== b.id))}
                        className="text-xs text-red-400 font-medium">Remove</button>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(["length", "width"] as const).map(field => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                          {field === "length" ? "Length (ft)" : "Width (ft)"}
                        </label>
                        <input type="number" min="0" placeholder="0" value={b[field]}
                          onChange={e => setBeds(prev => prev.map(x => x.id === b.id ? { ...x, [field]: e.target.value } : x))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`}
                          onBlur={e => e.target.style.boxShadow = "none"}
                          style={{ outline: "none" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={() => setBeds(prev => [...prev, defaultBed()])}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another bed
              </button>
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
                <div className="text-4xl mb-4">🥕</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your bed dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total volume</div>
                      <div className="text-3xl font-black">{result.totalCuFt} <span className="text-xl font-semibold text-green-200">cu ft</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black">
                        {mixType === "premix" ? result.premixBags : result.soilBags + result.compostBags + result.perliteBags}
                      </div>
                      <div className="text-xs text-green-300">total bags</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {beds.length} bed{beds.length !== 1 ? "s" : ""} · {depth}" deep ·{" "}
                    {mixType === "premix" ? "all-in-one premix" : "60/30/10 DIY mix"}
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

      <div className="max-w-4xl mx-auto px-4 pb-4">
        <p className="text-sm text-slate-500">
          Topping a border rather than filling a frame? The{" "}
          <a href="/mulch-calculator" className="font-semibold underline" style={{ color: GREEN }}>
            mulch calculator
          </a>{" "}
          works out cubic yards and bag counts for mulch, topsoil, compost and gravel at any bed depth.
        </p>
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
