"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const FENCE_STYLES = [
  { id: "panel", label: "Pre-Built Panels (6 ft)", panelW: 8, name: "6×8 ft Wood Fence Panels" },
  { id: "picket", label: "Individual Pickets (6 ft)", panelW: 0.33, name: "6 ft Dog-Ear Fence Pickets" },
  { id: "privacy-vinyl", label: "Vinyl Panels (6 ft)", panelW: 8, name: "6×8 ft Vinyl Fence Panels" },
  { id: "rail", label: "3-Rail Split Rail", panelW: 8, name: "8 ft Split Rail Sections" },
];

function calc(linearFt: number, postSpacing: number, styleId: string, gateCount: number) {
  const style = FENCE_STYLES.find(s => s.id === styleId)!;
  const posts = Math.ceil(linearFt / postSpacing) + 1;
  const panels = Math.ceil((linearFt - gateCount * 4) / style.panelW); // subtract gate openings
  const rails = styleId === "rail" ? panels * 3 : 0;
  const concreteBags = posts * 2;
  const postCaps = posts;
  return { posts, panels, rails, concreteBags, postCaps, style };
}

export default function FenceCalculator() {
  const [linearFt, setLinearFt] = useState("100");
  const [postSpacing, setPostSpacing] = useState(8);
  const [styleId, setStyleId] = useState("panel");
  const [gateCount, setGateCount] = useState(0);
  const [fenceHeight, setFenceHeight] = useState(6);

  const result = useMemo(() => {
    const ft = parseFloat(linearFt);
    if (!ft) return null;
    return calc(ft, postSpacing, styleId, gateCount);
  }, [linearFt, postSpacing, styleId, gateCount]);

  const hasInput = !!result;
  const style = FENCE_STYLES.find(s => s.id === styleId)!;

  const shoppingItems = result ? [
    { qty: result.panels, name: style.name, note: `${result.panels} panels/sections — subtract for gate openings`, tip: "Tip: Buy 1-2 extra panels. Damaged panels happen during installation.", amazon: aUrl("B07BFYJ8ZQ"), hd: hdUrl(`${fenceHeight} ft ${styleId === "privacy-vinyl" ? "vinyl" : "wood"} fence panel`) },
    { qty: result.posts, name: `${fenceHeight + 2} ft × 4×4 Pressure-Treated Posts`, note: `${result.posts} posts — extra 2 ft for burial depth`, tip: "Tip: Posts should be buried 1/3 of their total length. A 6 ft fence needs posts buried 2+ ft.", amazon: aUrl("B01N3VKDIH"), hd: hdUrl("4x4 pressure treated post fence") },
    { qty: result.concreteBags, name: "80 lb Concrete Bags (Quikrete)", note: `${result.concreteBags} bags — 2 bags per post`, tip: "Tip: Dry-pour method works great for fence posts — pour dry mix, add water, tamp. No mixing required.", amazon: aUrl("B00H4ZPCW0"), hd: hdUrl("quikrete 80 lb concrete") },
    { qty: result.postCaps, name: "Post Caps (flat or decorative)", note: "Keeps water out of end grain — significantly extends post life", amazon: aUrl("B00004RFN0"), hd: hdUrl("fence post caps 4x4") },
    ...(gateCount > 0 ? [{ qty: gateCount, name: `${fenceHeight} ft Gate Kit`, note: `${gateCount} gate${gateCount > 1 ? "s" : ""} — includes hinges, latch, and framing hardware`, amazon: aUrl("B07BFHQT4Z"), hd: hdUrl(`${fenceHeight} ft fence gate kit`) }] : []),
    ...(styleId === "picket" ? [{ qty: Math.ceil(parseFloat(linearFt) / 8), name: "2×4 Fence Rails (8 ft)", note: "Horizontal rails that pickets attach to — 2 per 8 ft section", amazon: aUrl("B01N3VKDIH"), hd: hdUrl("2x4 pressure treated rail fence") }] : []),
    { qty: 2, name: "Fence Screws / Nails (1 lb box)", note: "Galvanized or coated only — never use plain steel with PT lumber", amazon: aUrl("B07J3LZHVH"), hd: hdUrl("galvanized fence screws nails") },
    { qty: 1, name: "Post Hole Digger / Clamshell", note: "Manual digger for 6 posts or fewer — rent a gas auger for more", tip: "Tip: Rent a 2-person gas auger from HD for $60/day if you have more than 8 posts to dig.", amazon: aUrl("B000E1CWAG"), hd: hdUrl("post hole digger clamshell") },
    { qty: 1, name: "Line Level + Chalk Line", note: "Keep your top rails perfectly level across the run", amazon: aUrl("B000077GZY"), hd: hdUrl("line level chalk line fence") },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>Build<span style={{ color: "#86efac" }}>Guiders</span></a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Guides</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🪟</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Fence Calculator</h1>
              <p className="text-slate-500 mt-1">Posts, panels, concrete, post caps, and gate hardware for any fence run.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Fence Style</h2></div>
              <div className="p-4 space-y-2">
                {FENCE_STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyleId(s.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={styleId === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dimensions</h2></div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Total Linear Feet</label>
                  <input type="number" min="0" placeholder="e.g. 150" value={linearFt} onChange={e => setLinearFt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                    onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                  <p className="text-xs text-slate-400 mt-1">Measure all sides of your fence run</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Fence Height</label>
                  <div className="flex gap-2">
                    {[4, 6, 8].map(n => (
                      <button key={n} onClick={() => setFenceHeight(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={fenceHeight === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n} ft
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Post Spacing</label>
                  <div className="flex gap-2">
                    {[6, 8, 10].map(n => (
                      <button key={n} onClick={() => setPostSpacing(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={postSpacing === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n} ft
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">8 ft is standard. 6 ft for taller or heavier fences.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Number of Gates</label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(n => (
                      <button key={n} onClick={() => setGateCount(n)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={gateCount === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-3 space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🪟</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your fence run and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Fence run</div>
                      <div className="text-3xl font-black">{parseFloat(linearFt)} <span className="text-xl font-semibold text-green-200">linear ft</span></div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div><div className="text-2xl font-black">{result.posts}</div><div className="text-xs text-green-300">posts</div></div>
                      <div><div className="text-2xl font-black">{result.panels}</div><div className="text-xs text-green-300">panels</div></div>
                      <div><div className="text-2xl font-black">{result.concreteBags}</div><div className="text-xs text-green-300">concrete bags</div></div>
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
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Don't forget</p>
                    <p className="text-xs text-amber-700">Check your local zoning rules before you start. Fence height limits (typically 4 ft front yard, 6 ft backyard) and permit requirements vary by city. Call 811 before digging.</p>
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
