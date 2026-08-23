"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
// Search URLs, not /dp/ASIN. Roofing SKUs vary too much by region and brand to
// pin a single ASIN, and a wrong one 404s the affiliate click.
const aUrl = (q: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const SQUARE_SQFT = 100; // A roofing "square" is 100 sq ft, by definition.
const BUNDLES_PER_SQUARE = 3; // Standard for 3-tab and architectural shingles.
const UNDERLAYMENT_SQ_PER_ROLL = 10; // Typical synthetic roll covers 10 squares.
const DRIP_EDGE_PIECE_FT = 10;
const RIDGE_CAP_FT_PER_BUNDLE = 20;
const NAILS_PER_SQUARE = 320; // 4 nails x 80 shingles.

type RoofStyle = "gable" | "hip" | "shed";

/** Roof pitch multiplier is pure geometry: the slope length per unit of run. */
function pitchMultiplier(rise: number) {
  return Math.sqrt(1 + (rise / 12) ** 2);
}

const PITCHES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Hip roofs cut more shingles at the hips, so they waste more than a gable.
const WASTE: Record<RoofStyle, number> = { gable: 0.1, hip: 0.15, shed: 0.1 };

function calcRoof(l: number, w: number, rise: number, style: RoofStyle) {
  const footprint = l * w;
  const multiplier = pitchMultiplier(rise);
  const roofArea = footprint * multiplier;
  const waste = WASTE[style];
  const orderArea = roofArea * (1 + waste);
  const squares = orderArea / SQUARE_SQFT;
  const perimeter = 2 * (l + w);

  // Eaves carry the starter strip; which edges are eaves depends on the style.
  const eaveFt = style === "gable" ? 2 * l : style === "hip" ? perimeter : l;
  // A hip roof's ridge is shortened by the two hip ends; a shed roof has none.
  const ridgeFt = style === "gable" ? l : style === "hip" ? Math.max(0, l - w) : 0;

  return {
    footprint,
    multiplier,
    roofArea,
    waste,
    orderArea,
    squares,
    perimeter,
    eaveFt,
    ridgeFt,
    bundles: Math.ceil(squares * BUNDLES_PER_SQUARE),
    underlaymentRolls: Math.ceil(squares / UNDERLAYMENT_SQ_PER_ROLL),
    dripEdgePieces: Math.ceil(perimeter / DRIP_EDGE_PIECE_FT),
    starterPieces: Math.ceil(eaveFt / DRIP_EDGE_PIECE_FT),
    ridgeCapBundles: Math.ceil(ridgeFt / RIDGE_CAP_FT_PER_BUNDLE),
    nails: Math.ceil((squares * NAILS_PER_SQUARE) / 100) * 100,
  };
}

export default function RoofCalculator() {
  const [style, setStyle] = useState<RoofStyle>("gable");
  const [length, setLength] = useState("40");
  const [width, setWidth] = useState("28");
  const [rise, setRise] = useState("6");

  const result = useMemo(() => {
    const l = parseFloat(length), w = parseFloat(width), r = parseFloat(rise);
    if (!l || !w || !r) return null;
    return calcRoof(l, w, r, style);
  }, [length, width, rise, style]);

  // Checked 2026-08-21: Amazon does not stock shingles, drip edge, starter strip
  // or ridge cap at roof scale — the shingle listings are 8-21 piece shed packs at
  // roughly double lumberyard price, and "drip edge" returns door rain caps. Those
  // rows carry the quantity with no buy button rather than an affiliate link to
  // the wrong product.
  const shoppingItems: {
    qty: number; name: string; note: string; tip: string; amazon?: string; local?: string;
  }[] = result ? [
    // Fall protection leads the list because it is the one thing to have on the
    // roof before anything else gets carried up there.
    {
      qty: 1,
      name: "Roof Harness & Fall Protection Kit",
      note: "Harness, rope grab, and a ridge anchor — the whole setup, before any material goes up",
      tip: "Tip: Falls are the leading cause of death in roofing. Anything above a single storey or a 6/12 pitch needs this and roof jacks.",
      amazon: aUrl("roofing fall protection harness kit"),
    },
    {
      qty: result.bundles,
      name: "Architectural Shingles (bundles)",
      note: `${result.bundles} bundles = ${Math.ceil(result.squares)} squares at 3 bundles per square`,
      tip: "Tip: Buy all bundles in one order. Colour lots vary between batches and a mid-roof switch shows.",
      local: "Lumberyard or home center — sold by the square, delivered to the kerb",
    },
    {
      qty: result.underlaymentRolls,
      name: "Synthetic Underlayment (10 sq rolls)",
      note: "Goes down before the shingles, over the whole deck",
      tip: "Tip: Synthetic beats felt on a hot roof — it won't wrinkle or tear underfoot.",
      amazon: aUrl("synthetic roofing underlayment roll"),
    },
    {
      qty: result.dripEdgePieces,
      name: "Drip Edge (10 ft pieces)",
      note: `${Math.ceil(result.perimeter)} ft of perimeter`,
      tip: "Tip: Drip edge goes under the underlayment at the rakes, over it at the eaves.",
      local: "Home center — ask for roof drip edge, not door drip cap",
    },
    {
      qty: result.starterPieces,
      name: "Starter Strip",
      note: `${Math.ceil(result.eaveFt)} ft of eaves`,
      tip: "Tip: Don't substitute cut-up shingles. Starter strip has the sealant in the right place.",
      local: "Buy with your shingles — match the brand",
    },
    ...(result.ridgeCapBundles > 0 ? [{
      qty: result.ridgeCapBundles,
      name: "Hip & Ridge Cap (bundles)",
      note: `${Math.ceil(result.ridgeFt)} ft of ridge at ~${RIDGE_CAP_FT_PER_BUNDLE} ft per bundle`,
      tip: "",
      local: "Buy with your shingles — match the brand",
    }] : []),
    {
      qty: result.nails,
      name: "Roofing Nails (galvanized)",
      note: `~${result.nails} nails at 4 per shingle`,
      tip: "Tip: Check your local code — high-wind zones often require 6 nails per shingle, not 4.",
      amazon: aUrl("galvanized roofing nails coil"),
    },
    {
      qty: 1,
      name: "Roofing Nailer or Hammer Tacker",
      note: "Hand-nailing a full roof is a two-day job that a nailer does in hours",
      tip: "",
      amazon: aUrl("roofing nailer"),
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>Build<span style={{ color: "#86efac" }}>Guiders</span></a>
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Guides</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🏠</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Roof Calculator</h1>
              <p className="text-slate-500 mt-1">Roof area, squares, and shingle bundles from your footprint and pitch — plus the rest of the materials.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Roof Style</h2></div>
              <div className="p-4 space-y-2">
                {([["gable", "Gable", "Two slopes meeting at a ridge"], ["hip", "Hip", "Slopes on all four sides"], ["shed", "Shed / Lean-to", "One single slope"]] as [RoofStyle, string, string][]).map(([val, label, sub]) => (
                  <button key={val} onClick={() => setStyle(val)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={style === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {label} <span className="text-xs opacity-70 block">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Footprint &amp; Pitch</h2></div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {([["length", "Length (ft)", length, setLength], ["width", "Width (ft)", width, setWidth]] as [string, string, string, (v: string) => void][]).map(([key, label, val, setter]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                      <input type="number" min="0" placeholder="0" value={val} onChange={e => setter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                        onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                    </div>
                  ))}
                  <p className="col-span-2 text-xs text-slate-400 -mt-1">Measure the building footprint at ground level, not the slope.</p>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pitch (rise per 12&quot; of run)</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {PITCHES.map(n => (
                        <button key={n} onClick={() => setRise(String(n))} className="py-2 rounded-lg text-xs font-bold border-2 transition-all"
                          style={rise === String(n) ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                          {n}/12
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">4/12 to 6/12 covers most houses. Not sure? See the pitch table below.</p>
                  </div>
                </div>
              </div>
            </div>

            <a href="#shopping-list" className="block w-full py-3.5 text-white font-bold rounded-xl text-base text-center shadow-sm no-underline"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GREEN; }}>
              See My Shopping List →
            </a>
          </div>

          <div className="lg:col-span-3 space-y-4" id="shopping-list">
            {!result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Choose your roof style, enter the footprint, and pick a pitch.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Roof area</div>
                      <div className="text-3xl font-black">{Math.round(result.roofArea).toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                      <div className="text-sm text-green-300 mt-1">{Math.round(result.footprint).toLocaleString()} sq ft footprint × {result.multiplier.toFixed(3)} pitch multiplier</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black">{Math.ceil(result.squares)}</div>
                      <div className="text-xs text-green-300">squares to order</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    Includes {Math.round(result.waste * 100)}% waste for a {style} roof. Order by the square — {Math.round(result.orderArea).toLocaleString()} sq ft total.
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-800">Your Shopping List</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Based on the dimensions on the left — edit them to match your roof and this updates as you type.</p>
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
                        <div className="flex gap-2 ml-11 items-center">
                          {item.amazon ? (
                            <a href={item.amazon} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">{item.local}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Before you start</p>
                    <p className="text-xs text-amber-700">Re-roofing usually needs a permit, and most codes allow only two layers of shingles before a full tear-off. Check with your local building department first. Anything above a 6/12 pitch or a single storey warrants roof jacks and a harness — falls are the leading cause of death in roofing.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Serves the "roof pitch" searchers, who arrive without knowing the number
            the calculator above is asking them for. */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-800">Roof Pitch Multiplier Table</h2>
            <p className="text-sm text-slate-500 mt-1">
              A roof is always bigger than the footprint it sits on. Multiply your footprint area by the number for your pitch to get the actual roof area.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider">Pitch</th>
                  <th className="px-5 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider">Multiplier</th>
                  <th className="px-5 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider">Angle</th>
                  <th className="px-5 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider">1,000 sq ft footprint becomes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PITCHES.map(n => (
                  <tr key={n} className={rise === String(n) ? "bg-green-50" : ""}>
                    <td className="px-5 py-2.5 font-bold text-slate-800">{n}/12</td>
                    <td className="px-5 py-2.5 text-slate-600">{pitchMultiplier(n).toFixed(3)}</td>
                    <td className="px-5 py-2.5 text-slate-600">{((Math.atan(n / 12) * 180) / Math.PI).toFixed(1)}°</td>
                    <td className="px-5 py-2.5 text-slate-600">{Math.round(1000 * pitchMultiplier(n)).toLocaleString()} sq ft</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">How to measure your pitch:</strong> hold a level horizontally against the roof line, mark 12 inches along it, then measure straight down from that mark to the roof surface. That drop in inches is your rise — a 6 inch drop is a 6/12 pitch.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 BuildGuiders.com</p>
          <p className="text-xs text-slate-300">Earns from qualifying purchases via Amazon Associates and affiliate programs.</p>
        </div>
      </footer>
    </div>
  );
}
