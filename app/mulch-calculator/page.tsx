"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const MATERIALS = [
  { id: "mulch", label: "Mulch", bagCuFt: 2, cuFtPerYard: 27 },
  { id: "topsoil", label: "Topsoil", bagCuFt: 1.5, cuFtPerYard: 27 },
  { id: "gravel", label: "Gravel / Stone", bagCuFt: 0.5, cuFtPerYard: 27 },
  { id: "compost", label: "Compost", bagCuFt: 1, cuFtPerYard: 27 },
  { id: "sand", label: "Play Sand / Paver Sand", bagCuFt: 0.5, cuFtPerYard: 27 },
];

interface Bed { id: string; length: string; width: string; }
const defaultBed = (): Bed => ({ id: crypto.randomUUID(), length: "", width: "" });

function calc(beds: Bed[], depth: number, matId: string) {
  const mat = MATERIALS.find(m => m.id === matId)!;
  const totalSqFt = beds.reduce((sum, b) => sum + (parseFloat(b.length) || 0) * (parseFloat(b.width) || 0), 0);
  const depthFt = depth / 12;
  const totalCuFt = totalSqFt * depthFt;
  const cubicYards = totalCuFt / 27;
  const bags = Math.ceil(totalCuFt / mat.bagCuFt);
  const fabricRolls = Math.ceil(totalSqFt / 150); // 150 sqft per roll
  return { totalSqFt: Math.round(totalSqFt), totalCuFt: Math.round(totalCuFt * 10) / 10, cubicYards: Math.round(cubicYards * 10) / 10, bags, fabricRolls, mat };
}

export default function MulchCalculator() {
  const [beds, setBeds] = useState<Bed[]>([defaultBed()]);
  const [depth, setDepth] = useState(3);
  const [matId, setMatId] = useState("mulch");
  const [delivery, setDelivery] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const result = useMemo(() => calc(beds, depth, matId), [beds, depth, matId]);
  const hasInput = beds.some(b => parseFloat(b.length) > 0 && parseFloat(b.width) > 0);

  const shoppingItems = [
    delivery
      ? { qty: Math.ceil(result.cubicYards), name: `${result.mat.label} — Bulk Delivery (cubic yards)`, note: `${result.cubicYards} cubic yards — order bulk delivery for areas over 3 yards`, tip: "Tip: One cubic yard covers ~100 sq ft at 3\" deep. Most suppliers deliver for $30–60 on top of material cost.", amazon: hdUrl(`bulk ${result.mat.label} delivery`), hd: hdUrl(`bulk ${result.mat.label}`) }
      : { qty: result.bags, name: `${result.mat.label} Bags (${result.mat.bagCuFt} cu ft each)`, note: `${result.bags} bags — bulk delivery is cheaper over 3 yards but bags work for smaller areas`, tip: `Tip: ${result.cubicYards > 3 ? "At " + result.cubicYards + " yards, bulk delivery will save you money over bags." : "Bags are the right call for your area size."}`, amazon: aUrl("B07BFYQZ1W"), hd: hdUrl(`${result.mat.label} bag`) },
    { qty: result.fabricRolls, name: "Landscape Fabric (4 ft × 50 ft roll)", note: `${result.fabricRolls} rolls — blocks weeds under mulch or gravel`, tip: "Tip: Use staples every 12\" to hold fabric flat before adding mulch.", amazon: aUrl("B000IEPFAS"), hd: hdUrl("landscape fabric weed barrier") },
    { qty: 1, name: "Landscape Staples (50 pack)", note: "Pins fabric to ground so it doesn't shift", amazon: aUrl("B07N5VXPLD"), hd: hdUrl("landscape fabric staples pins") },
    { qty: 1, name: "Landscape Edging (20 ft coil)", note: "Keeps mulch contained and beds looking clean", tip: "Tip: Black aluminum edging is more durable than plastic and installs without stakes.", amazon: aUrl("B00002N80N"), hd: hdUrl("landscape edging border") },
    { qty: 1, name: "Garden Gloves (pair)", note: "Mulch and topsoil bags shred bare hands", amazon: aUrl("B00V2DTPDI"), hd: hdUrl("garden work gloves") },
    { qty: 1, name: "Bow Rake", note: "Spread and level mulch evenly — you'll use it constantly", amazon: aUrl("B000H5RMAC"), hd: hdUrl("bow rake garden") },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>Build<span style={{ color: "#86efac" }}>Guiders</span></a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides/best-mulch-for-flower-beds" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Buying Guide</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🌿</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Mulch & Topsoil Calculator</h1>
              <p className="text-slate-500 mt-1">Bags or cubic yards, landscape fabric, edging — for any bed depth.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Material</h2></div>
              <div className="p-4 space-y-2">
                {MATERIALS.map(m => (
                  <button key={m.id} onClick={() => setMatId(m.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={matId === m.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Depth</h2></div>
              <div className="p-4 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 6].map(n => (
                    <button key={n} onClick={() => setDepth(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={depth === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      {n}"
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">3" is standard for mulch. 6" for new raised beds. Paver sand: 1".</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Delivery vs Bags</h2></div>
              <div className="p-4">
                <div className="flex gap-2">
                  {[[false, "Bags (store pickup)"], [true, "Bulk Delivery"]].map(([val, label]) => (
                    <button key={String(val)} onClick={() => setDelivery(val as boolean)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={delivery === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      {label as string}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Bulk delivery saves money above ~3 cubic yards</p>
              </div>
            </div>

            <div className="space-y-3">
              {beds.map((b, i) => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Bed / Area {beds.length > 1 ? i + 1 : ""}</h2>
                    {beds.length > 1 && <button onClick={() => setBeds(prev => prev.filter(x => x.id !== b.id))} className="text-xs text-red-400 font-medium">Remove</button>}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[["length", "Length (ft)"], ["width", "Width (ft)"]].map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder="0" value={(b as any)[field]}
                          onChange={e => setBeds(prev => prev.map(x => x.id === b.id ? { ...x, [field]: e.target.value } : x))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setBeds(prev => [...prev, defaultBed()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another bed
              </button>
            </div>

            <button onClick={() => setCalculated(true)} disabled={!hasInput} className="w-full py-3.5 text-white font-bold rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GREEN; }}>
              Calculate & Build My List →
            </button>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {!calculated || !hasInput ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🌿</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your bed dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total area</div>
                      <div className="text-3xl font-black">{result.totalSqFt} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div><div className="text-3xl font-black">{result.cubicYards}</div><div className="text-xs text-green-300">cubic yards</div></div>
                      {!delivery && <div><div className="text-3xl font-black">{result.bags}</div><div className="text-xs text-green-300">bags</div></div>}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {result.totalCuFt} cubic feet at {depth}" deep
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-black text-slate-800">Your Shopping List</h2></div>
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
                          <a href={item.amazon} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
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
          <p className="text-xs text-slate-300">Earns from qualifying purchases via Amazon Associates and affiliate programs.</p>
        </div>
      </footer>
    </div>
  );
}
