"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const BAG_CUFT = 0.6; // 80lb bag = 0.6 cu ft

type ProjectType = "slab" | "footing" | "postholes";

function calcSlab(l: number, w: number, depth: number) {
  const cuFt = l * w * (depth / 12);
  const cuYards = cuFt / 27;
  const bags = Math.ceil(cuFt / BAG_CUFT);
  return { cuFt, cuYards, bags };
}
function calcFooting(l: number, w: number, depth: number) {
  return calcSlab(l, w, depth);
}
function calcPostHoles(diameter: number, depth: number, count: number) {
  const r = (diameter / 12) / 2;
  // Full cylinder minus ~10% for post displacement and spillage
  const cuFt = Math.PI * r * r * (depth / 12) * count * 0.9;
  const cuYards = cuFt / 27;
  const bags = Math.ceil(cuFt / BAG_CUFT);
  return { cuFt, cuYards, bags };
}

export default function ConcreteCalculator() {
  const [type, setType] = useState<ProjectType>("slab");
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("10");
  const [depth, setDepth] = useState("4");
  const [holeDiameter, setHoleDiameter] = useState("12");
  const [holeDepth, setHoleDepth] = useState("36");
  const [holeCount, setHoleCount] = useState("4");
  const result = useMemo(() => {
    if (type === "slab") {
      const l = parseFloat(length), w = parseFloat(width), d = parseFloat(depth);
      if (!l || !w || !d) return null;
      return calcSlab(l, w, d);
    }
    if (type === "footing") {
      const l = parseFloat(length), w = parseFloat(width), d = parseFloat(depth);
      if (!l || !w || !d) return null;
      return calcFooting(l, w, d);
    }
    const diam = parseFloat(holeDiameter), dep = parseFloat(holeDepth), cnt = parseFloat(holeCount);
    if (!diam || !dep || !cnt) return null;
    return calcPostHoles(diam, dep, cnt);
  }, [type, length, width, depth, holeDiameter, holeDepth, holeCount]);

  const bags80lb = result ? result.bags : 0;
  const useReadyMix = result ? result.cuYards > 1 : false;

  const shoppingItems = result ? [
    useReadyMix
      ? { qty: Math.ceil(result.cuYards), name: "Ready-Mix Concrete (cubic yards)", note: `${Math.round(result.cuYards * 10) / 10} yards — order ready-mix delivery for projects over 1 yard`, tip: "Tip: Add 10% to your order. Running short on a pour is a disaster.", amazon: hdUrl("ready mix concrete delivery"), hd: hdUrl("concrete delivery ready mix") }
      : { qty: bags80lb, name: "Quikrete 80 lb Concrete Mix", note: `${bags80lb} bags = ~${Math.round(result.cuFt * 10) / 10} cubic feet`, tip: "Tip: Rent a mixer for more than 10 bags — hand mixing is exhausting and inconsistent.", amazon: aUrl("B00H4ZPCW0"), hd: hdUrl("quikrete 80lb concrete bag") },
    { qty: 1, name: "Mixing Tub (6 cu ft)", note: "For hand mixing small pours — deep enough to actually mix", amazon: aUrl("B0000AXBLU"), hd: hdUrl("concrete mixing tub") },
    { qty: 1, name: "Mason's Hoe", note: "Mixes concrete faster and more thoroughly than a shovel", amazon: aUrl("B00004RFMR"), hd: hdUrl("mason hoe concrete mixing") },
    ...(type === "slab" ? [
      { qty: 1, name: "Concrete Float (bull float)", note: "Smooth the surface before it sets — you have a small window", amazon: aUrl("B000H5S8BE"), hd: hdUrl("concrete bull float") },
      { qty: Math.ceil((parseFloat(length) || 0) * (parseFloat(width) || 0) / 20), name: "Rebar (1/2\", 10 ft)", note: "Reinforce slabs — lay in a grid every 18\"", amazon: aUrl("B01N3VKDQX"), hd: hdUrl("rebar 1/2 inch 10 ft") },
      { qty: 1, name: "Expansion Joint (20 ft)", note: "Control joints prevent random cracking in large slabs", amazon: aUrl("B0000AXBLR"), hd: hdUrl("concrete expansion joint") },
    ] : []),
    ...(type === "postholes" ? [
      { qty: parseInt(holeCount) || 1, name: "Tube Forms / Sonotubes", note: "Keep concrete in a clean cylinder — required for post holes", amazon: aUrl("B000H5S8BF"), hd: hdUrl("concrete tube form sonotube") },
    ] : []),
    { qty: 1, name: "Safety Glasses + Gloves", note: "Wet concrete is caustic — protect your skin and eyes", amazon: aUrl("B07YPQQ3MN"), hd: hdUrl("safety glasses concrete gloves") },
  ] : [];

  const hasInput = !!result;

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
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🏗️</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Concrete Calculator</h1>
              <p className="text-slate-500 mt-1">Bags or cubic yards for slabs, footings, or post holes — plus all your tools.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Project Type</h2></div>
              <div className="p-4 space-y-2">
                {[["slab", "Slab / Patio", "Flat pour — patio, walkway, shed floor"], ["footing", "Footing / Foundation", "Strip or pad footing for walls or posts"], ["postholes", "Post Holes", "Deck posts, fence posts, mailbox"]].map(([val, label, sub]) => (
                  <button key={val} onClick={() => setType(val as ProjectType)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={type === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {label} <span className="text-xs opacity-70 block">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dimensions</h2></div>
              <div className="p-4">
                {(type === "slab" || type === "footing") ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[["length", "Length (ft)", length, setLength], ["width", "Width (ft)", width, setWidth]].map(([key, label, val, setter]: any) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder="0" value={val} onChange={e => setter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Thickness (inches)</label>
                      <div className="flex gap-2">
                        {[4, 6, 8, 12].map(n => (
                          <button key={n} onClick={() => setDepth(String(n))} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                            style={depth === String(n) ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                            {n}"
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">4" standard patio, 6" driveway, 8"+ heavy load</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[["holeDiameter", "Hole Diameter (inches)", holeDiameter, setHoleDiameter, "8, 10, 12, 16"], ["holeDepth", "Hole Depth (inches)", holeDepth, setHoleDepth, "36\" = 3 ft"], ["holeCount", "Number of Holes", holeCount, setHoleCount, ""]].map(([key, label, val, setter, hint]: any) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder="0" value={val} onChange={e => setter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            {!result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Choose your project type, enter dimensions, and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Concrete needed</div>
                      <div className="text-3xl font-black">{Math.round(result.cuYards * 100) / 100} <span className="text-xl font-semibold text-green-200">cubic yards</span></div>
                      <div className="text-sm text-green-300 mt-1">{Math.round(result.cuFt * 10) / 10} cubic feet</div>
                    </div>
                    <div className="text-center">
                      {useReadyMix ? (
                        <><div className="text-3xl font-black">{Math.ceil(result.cuYards)}</div><div className="text-xs text-green-300">yards ready-mix</div></>
                      ) : (
                        <><div className="text-3xl font-black">{bags80lb}</div><div className="text-xs text-green-300">80 lb bags</div></>
                      )}
                    </div>
                  </div>
                  {useReadyMix && <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">Over 1 yard — ready-mix delivery recommended over bags</div>}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-800">Your Shopping List</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Based on the dimensions on the left — edit them to match your project and this updates as you type.</p>
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
                          <a href={item.amazon} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Don't forget</p>
                    <p className="text-xs text-amber-700">Check for underground utilities before digging. Call 811 (USA) — it's free and required by law. This catches gas, electric, and water lines before you hit them.</p>
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
