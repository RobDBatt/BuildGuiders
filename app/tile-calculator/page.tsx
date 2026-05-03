"use client";
import { useState, useMemo } from "react";

const GREEN = "#1B4332";
const AMAZON_TAG = "buildguiders-20";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const TILE_SIZES = [
  { id: "12x12", label: "12\" × 12\"", sqFt: 1 },
  { id: "18x18", label: "18\" × 18\"", sqFt: 2.25 },
  { id: "24x24", label: "24\" × 24\"", sqFt: 4 },
  { id: "3x6", label: "3\" × 6\" Subway", sqFt: 0.125 },
  { id: "4x4", label: "4\" × 4\"", sqFt: 0.111 },
  { id: "6x6", label: "6\" × 6\"", sqFt: 0.25 },
];

interface Area { id: string; length: string; width: string; }
const defaultArea = (): Area => ({ id: crypto.randomUUID(), length: "", width: "" });

function calc(areas: Area[], tileSizeId: string, waste: number, groutLine: number) {
  const tileSize = TILE_SIZES.find(t => t.id === tileSizeId)!;
  const totalSqFt = areas.reduce((sum, a) => sum + (parseFloat(a.length) || 0) * (parseFloat(a.width) || 0), 0);
  const withWaste = totalSqFt * (1 + waste / 100);
  const tileCount = Math.ceil(withWaste / tileSize.sqFt);
  const groutBags = Math.ceil(totalSqFt / 50); // 1 bag per ~50 sqft
  const adhesiveBags = Math.ceil(totalSqFt / 40); // 1 bag per ~40 sqft
  return { totalSqFt: Math.round(totalSqFt), withWaste: Math.round(withWaste), tileCount, groutBags, adhesiveBags, tileSize };
}

export default function TileCalculator() {
  const [areas, setAreas] = useState<Area[]>([defaultArea()]);
  const [tileSizeId, setTileSizeId] = useState("12x12");
  const [waste, setWaste] = useState(10);
  const [groutLine, setGroutLine] = useState(3);
  const [surface, setSurface] = useState<"floor" | "wall">("floor");
  const [calculated, setCalculated] = useState(false);
  const result = useMemo(() => calc(areas, tileSizeId, waste, groutLine), [areas, tileSizeId, waste, groutLine]);
  const hasInput = areas.some(a => parseFloat(a.length) > 0 && parseFloat(a.width) > 0);

  const shoppingItems = [
    { qty: result.tileCount, name: `${TILE_SIZES.find(t => t.id === tileSizeId)!.label} Tiles`, note: `${result.tileCount} tiles — includes ${waste}% waste factor`, tip: "Tip: Buy 5–10 extra and keep them. Future repairs need matching tiles, and discontinued patterns are impossible to find.", amazon: aUrl("B07B1H3MPC"), hd: hdUrl("floor tile") },
    { qty: result.adhesiveBags, name: surface === "floor" ? "Floor Tile Mortar (50 lb)" : "Wall Tile Adhesive (50 lb)", note: "Coverage ~40 sq ft per bag depending on notch size", tip: "Tip: Use a 3/16\" V-notch for wall tile, 1/4\" square notch for floor tile.", amazon: aUrl("B000H5RYM4"), hd: hdUrl("tile mortar adhesive") },
    { qty: result.groutBags, name: "Grout (10 lb bag)", note: `${groutLine}/16\" grout lines — ~50 sq ft per bag`, tip: "Tip: Unsanded grout for joints under 1/8\", sanded for joints 1/8\" and wider.", amazon: aUrl("B000H5S8BC"), hd: hdUrl("tile grout sanded") },
    { qty: 1, name: "Notched Trowel Set", note: "You need different notch sizes for floor vs. wall — get a set", amazon: aUrl("B000IHB8NW"), hd: hdUrl("notched trowel tile") },
    { qty: 1, name: "Grout Float", note: "Rubber float for spreading and working grout into joints", amazon: aUrl("B000H5S8B2"), hd: hdUrl("grout float") },
    { qty: 2, name: "Tile Spacers (bag)", note: `${groutLine}/16\" spacers — consistent grout lines every time`, amazon: aUrl("B00004RFLT"), hd: hdUrl(`tile spacers ${groutLine}/16`) },
    { qty: 1, name: "Tile Sealer (1 qt)", note: "Seal grout after it cures — protects from stains, required in kitchens and bathrooms", amazon: aUrl("B001BCB1ZO"), hd: hdUrl("tile grout sealer") },
    { qty: 1, name: "Tile Wet Saw Rental or Score-and-Snap Cutter", note: "You'll need cuts. Rent a wet saw from HD for $50/day or buy a snap cutter for straight cuts.", amazon: aUrl("B07YPQQ3KR"), hd: hdUrl("tile cutter snap") },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>Build<span style={{ color: "#86efac" }}>Guiders</span></a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🔲</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Tile Calculator</h1>
              <p className="text-slate-500 mt-1">Tile count, mortar, grout, and every tool — for floor or wall.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Surface</h2></div>
              <div className="p-4 flex gap-2">
                {[["floor", "Floor"], ["wall", "Wall"]].map(([val, label]) => (
                  <button key={val} onClick={() => setSurface(val as "floor" | "wall")} className="flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all"
                    style={surface === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Tile Size</h2></div>
              <div className="p-4 space-y-2">
                {TILE_SIZES.map(t => (
                  <button key={t.id} onClick={() => setTileSizeId(t.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={tileSizeId === t.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Settings</h2></div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Grout Line Width</label>
                  <div className="flex gap-2">
                    {[3, 6, 8].map(n => (
                      <button key={n} onClick={() => setGroutLine(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={groutLine === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n}/16"
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Waste Factor</label>
                  <div className="flex gap-2">
                    {[10, 15, 20].map(n => (
                      <button key={n} onClick={() => setWaste(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={waste === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Use 20% for diagonal installs or complex cuts</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {areas.map((a, i) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Area {areas.length > 1 ? i + 1 : ""}</h2>
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
              <button onClick={() => setAreas(prev => [...prev, defaultArea()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another area
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
                <div className="text-4xl mb-4">🔲</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your area dimensions and click Calculate.</p>
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
                      <div><div className="text-3xl font-black">{result.tileCount}</div><div className="text-xs text-green-300">tiles</div></div>
                      <div><div className="text-3xl font-black">{result.groutBags}</div><div className="text-xs text-green-300">grout bags</div></div>
                    </div>
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
                          <a href={item.hd} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#F96302" }}>Home Depot</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Don't forget</p>
                    <p className="text-xs text-amber-700">Grout haze remover — after grouting, a film forms on tile faces that's hard to remove once it hardens. Get it while you're at the store.</p>
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
