"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332"; const AMBER = "#D97706"; const INK = "#1C1917";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const MATERIAL_TYPES = [
  { id: "hardwood", label: "Hardwood", boxSqFt: 20, waste: 0.10, unit: "planks" },
  { id: "laminate", label: "Laminate", boxSqFt: 24, waste: 0.10, unit: "planks" },
  { id: "lvp", label: "LVP / Vinyl", boxSqFt: 25, waste: 0.10, unit: "planks" },
  { id: "engineered", label: "Engineered Wood", boxSqFt: 22, waste: 0.12, unit: "planks" },
  { id: "carpet", label: "Carpet (sq yd)", boxSqFt: 9, waste: 0.15, unit: "sq yd" },
];

interface Area { id: string; length: string; width: string; }
const INITIAL_AREAS: Area[] = [{ id: "area-0", length: "12", width: "12" }];
let nextAreaId = 1;
const newArea = (): Area => ({ id: `area-${nextAreaId++}`, length: "", width: "" });

function calc(areas: Area[], matId: string, extraWaste: number) {
  const mat = MATERIAL_TYPES.find(m => m.id === matId)!;
  const totalSqFt = areas.reduce((sum, a) => sum + (parseFloat(a.length) || 0) * (parseFloat(a.width) || 0), 0);
  const withWaste = totalSqFt * (1 + mat.waste + extraWaste / 100);
  const boxes = Math.ceil(withWaste / mat.boxSqFt);
  return { totalSqFt: Math.round(totalSqFt), withWaste: Math.round(withWaste), boxes, mat };
}

function ShoppingList({ boxes, matId, totalSqFt }: { boxes: number; matId: string; totalSqFt: number }) {
  const mat = MATERIAL_TYPES.find(m => m.id === matId)!;
  const underlayRolls = Math.ceil(totalSqFt / 200);
  const items = [
    { qty: boxes, name: `${mat.label} Flooring`, note: `${boxes} boxes at ~${mat.boxSqFt} sq ft/box, waste included`, tip: "Tip: Buy from the same lot number — color can vary between production runs.", amazon: aUrl("B07YMT2XBP"), hd: hdUrl(`${mat.label} flooring`) },
    { qty: underlayRolls, name: "Underlayment", note: "Moisture barrier + sound dampening — don't skip on concrete subfloors", tip: "Tip: Overlap seams by 6\" and tape them.", amazon: aUrl("B00J4IATME"), hd: hdUrl("flooring underlayment") },
    { qty: 1, name: "Pull Bar + Tapping Block Kit", note: "You cannot install floating floor without these — most forgotten item", tip: "Tip: Rent a floor nailer from HD for hardwood nail-down installs.", amazon: aUrl("B000FPXBXI"), hd: hdUrl("pull bar tapping block flooring kit") },
    { qty: 2, name: "Transition Strip", note: "For doorways and where flooring meets tile or carpet", amazon: aUrl("B07B4BLGQK"), hd: hdUrl("flooring transition strip") },
    { qty: 1, name: "Spacers (bag of 100)", note: "1/4\" gap along all walls — required for floating floors", amazon: aUrl("B00004RFLT"), hd: hdUrl("flooring spacers 1/4 inch") },
    { qty: 1, name: "Flooring Adhesive (if glue-down)", note: "Only for glue-down LVP or hardwood — skip for floating", amazon: aUrl("B01NCYQTIK"), hd: hdUrl("flooring adhesive") },
    { qty: 1, name: "Foam Knee Pad Set", note: "You'll be on your knees for hours — get the good ones", amazon: aUrl("B0000AH9BO"), hd: hdUrl("foam knee pads") },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-black text-slate-800">Your Shopping List</h2>
        <p className="text-xs text-slate-400 mt-0.5">Based on the dimensions on the left — edit them to match your project and this updates as you type.</p>

        <p className="text-xs text-slate-400 mt-0.5">{boxes} boxes · {Math.round(totalSqFt)} sq ft — one trip</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map(item => (
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
      <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Don't forget</p>
        <p className="text-xs text-amber-700">Check your subfloor is level (within 3/16\" over 10 ft) before you start. An unlevel subfloor causes clicking, buckling, and gaps — the most common comeback trip.</p>
      </div>
    </div>
  );
}

export default function FlooringCalculator() {
  const [areas, setAreas] = useState<Area[]>(INITIAL_AREAS);
  const [matId, setMatId] = useState("lvp");
  const [extraWaste, setExtraWaste] = useState(0);
  const result = useMemo(() => calc(areas, matId, extraWaste), [areas, matId, extraWaste]);
  const hasInput = areas.some(a => parseFloat(a.length) > 0 && parseFloat(a.width) > 0);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>Build<span style={{ color: "#86efac" }}>Guiders</span></a>
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides/best-vinyl-plank-flooring" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Buying Guide</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🪵</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Flooring Calculator</h1>
              <p className="text-slate-500 mt-1">Boxes needed with waste factor, plus everything you'll need to install it.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Material Type</h2></div>
              <div className="p-4 space-y-2">
                {MATERIAL_TYPES.map(m => (
                  <button key={m.id} onClick={() => setMatId(m.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={matId === m.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {m.label} <span className="text-xs opacity-70">~{m.boxSqFt} sq ft/box · +{Math.round(m.waste * 100)}% waste</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Extra Waste %</h2></div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-3">Add extra for diagonal installs (+15%), complex rooms (+5–10%), or matching patterns.</p>
                <div className="flex gap-2">
                  {[0, 5, 10, 15].map(n => (
                    <button key={n} onClick={() => setExtraWaste(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={extraWaste === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      +{n}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {areas.map((a, i) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Room {areas.length > 1 ? i + 1 : ""}</h2>
                    {areas.length > 1 && <button onClick={() => setAreas(prev => prev.filter(x => x.id !== a.id))} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[["length", "Length (ft)"], ["width", "Width (ft)"]].map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder="0" value={(a as any)[field]}
                          onChange={e => setAreas(prev => prev.map(x => x.id === a.id ? { ...x, [field]: e.target.value } : x))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setAreas(prev => [...prev, newArea()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold transition-all"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another room
              </button>
            </div>

            {/* The list updates live as the inputs change, so this jumps to it
                rather than gating it — on mobile the results stack below. */}
            <a href="#shopping-list" className="block w-full py-3.5 text-white font-bold rounded-xl text-base text-center shadow-sm no-underline"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GREEN; }}>
              See My Shopping List →
            </a>
          </div>

          <div className="lg:col-span-3 space-y-4" id="shopping-list">
            {!hasInput ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🪵</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">Enter your room dimensions on the left and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total area</div>
                      <div className="text-3xl font-black">{result.totalSqFt.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                      <div className="text-sm text-green-300 mt-1">{result.withWaste} sq ft with {result.mat.waste * 100 + extraWaste}% waste</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black">{result.boxes}</div>
                      <div className="text-xs text-green-300 font-medium">boxes needed</div>
                    </div>
                  </div>
                </div>
                <ShoppingList boxes={result.boxes} matId={matId} totalSqFt={result.totalSqFt} />
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Total area = sum of all room lengths × widths</p>
                    <p>• Waste factor: {result.mat.label} standard {Math.round(result.mat.waste * 100)}% + your extra {extraWaste}%</p>
                    <p>• Box size: ~{result.mat.boxSqFt} sq ft per box (varies by brand — verify before buying)</p>
                    <p>• Result rounded up to nearest whole box</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 BuildGuiders.com · Free home project calculators</p>
          <p className="text-xs text-slate-300 max-w-sm text-right">Earns from qualifying purchases via Amazon Associates and affiliate programs.</p>
        </div>
      </footer>
    </div>
  );
}
