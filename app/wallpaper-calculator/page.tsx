"use client";
import { useState, useMemo } from "react";

const GREEN = "#1B4332";
const AMAZON_TAG = "buildguiders-20";
const aUrl = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const SQFT_PER_ROLL = 30; // standard single roll after trim (American sizing)

const WALL_TYPES = [
  { id: "peelstick",  label: "Peel & Stick",         desc: "No paste — easiest DIY, fully removable" },
  { id: "prepasted",  label: "Pre-Pasted",            desc: "Activate with water, semi-permanent" },
  { id: "unpasted",   label: "Traditional (Unpasted)", desc: "Paste separately, most durable" },
];

const REPEAT_TYPES = [
  { id: "none",  label: "No Pattern / Solid",   waste: 0.10, desc: "+10% waste factor" },
  { id: "small", label: "Small Repeat (< 6\")",  waste: 0.15, desc: "+15% waste factor" },
  { id: "large", label: "Large Repeat (> 6\")",  waste: 0.20, desc: "+20% waste factor" },
];

const HEIGHTS = [8, 9, 10, 12];

function calc(length: number, width: number, height: number, doors: number, windows: number, waste: number) {
  const perimeter  = 2 * (length + width);
  const grossArea  = perimeter * height;
  const netArea    = Math.max(0, grossArea - doors * 21 - windows * 15);
  const withWaste  = netArea * (1 + waste);
  const rolls      = Math.ceil(withWaste / SQFT_PER_ROLL);
  const pasteBags  = Math.ceil(rolls / 3); // 1 qt paste covers ~3 rolls
  return { perimeter: Math.round(perimeter), grossArea: Math.round(grossArea), netArea: Math.round(netArea), rolls, pasteBags };
}

export default function WallpaperCalculator() {
  const [length,     setLength]     = useState("");
  const [width,      setWidth]      = useState("");
  const [height,     setHeight]     = useState(9);
  const [doors,      setDoors]      = useState(1);
  const [windows,    setWindows]    = useState(2);
  const [wallType,   setWallType]   = useState("peelstick");
  const [repeatType, setRepeatType] = useState("none");
  const [calculated, setCalculated] = useState(false);

  const l = parseFloat(length) || 0;
  const w = parseFloat(width)  || 0;
  const hasInput = l > 0 && w > 0;
  const repeat = REPEAT_TYPES.find(r => r.id === repeatType)!;
  const result = useMemo(() => calc(l, w, height, doors, windows, repeat.waste), [l, w, height, doors, windows, repeat.waste]);

  const shoppingItems = [
    {
      qty:  result.rolls,
      name: wallType === "peelstick"
        ? "Peel & Stick Wallpaper (single rolls, ~30 sq ft each)"
        : wallType === "prepasted"
        ? "Pre-Pasted Wallpaper (single rolls, ~30 sq ft each)"
        : "Unpasted Wallpaper (single rolls, ~30 sq ft each)",
      note: `${result.rolls} roll${result.rolls !== 1 ? "s" : ""} — covers ${result.netArea} sq ft net wall area with ${Math.round(repeat.waste * 100)}% waste allowance`,
      tip:  wallType === "peelstick"
        ? "Tip: Order 1–2 extra rolls for pattern matching. Peel-and-stick is forgiving — you can reposition while hanging."
        : "Tip: Check that all rolls have the same dye lot number before ordering — color varies between dye lots.",
      amazon: aUrl(
        wallType === "peelstick" ? "peel and stick wallpaper removable" :
        wallType === "prepasted"  ? "pre-pasted wallpaper rolls"         :
        "wallpaper rolls traditional unpasted"
      ),
    },
    {
      qty:  1,
      name: "Wallpaper Smoothing Tool Set (squeegee + brush)",
      note: "Removes air bubbles and ensures full contact with the wall",
      tip:  "Tip: Work from the center of each strip outward to push bubbles to the edges.",
      amazon: aUrl("wallpaper smoothing tool set squeegee brush"),
    },
    {
      qty:  1,
      name: "Wallpaper Seam Roller",
      note: "Rolls seams flat for invisible joints between strips",
      amazon: aUrl("wallpaper seam roller"),
    },
    ...(wallType !== "peelstick" ? [{
      qty:  result.pasteBags,
      name: "Wallpaper Paste / Adhesive",
      note: `${result.pasteBags} qt${result.pasteBags !== 1 ? "s" : ""} — 1 qt covers approximately 3 rolls`,
      tip:  "Tip: For pre-pasted wallpaper, a water tray is enough. For unpasted, apply paste to the wall (not the paper) for easier positioning.",
      amazon: aUrl("wallpaper paste adhesive Roman pro"),
    }] : []),
    ...(wallType !== "peelstick" ? [{
      qty:  1,
      name: "Wallpaper Scoring Tool",
      note: "Scores existing wallpaper or paint for better adhesion",
      amazon: aUrl("wallpaper scoring tool paper tiger"),
    }] : []),
    {
      qty:  1,
      name: "Digital Level + Chalk Line",
      note: "Hanging plumb reference lines is the #1 step most DIYers skip — crooked first strip ruins the whole room",
      tip:  "Tip: Never use a door frame as your plumb reference — most door frames are not perfectly vertical.",
      amazon: aUrl("digital level chalk line set"),
    },
    {
      qty:  1,
      name: "Utility Knife + Extra Blades (25-pack)",
      note: "For trimming at ceiling, baseboard, and outlets — change blades often for clean cuts",
      amazon: aUrl("utility knife snap blade extra blades 25 pack"),
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
            <div className="w-12 h-12 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🌸</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wallpaper Calculator</h1>
              <p className="text-slate-500 mt-1">Rolls, paste, and tools — for peel-and-stick, pre-pasted, or traditional wallpaper.</p>
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
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Wallpaper Type</h2>
              </div>
              <div className="p-4 space-y-2">
                {WALL_TYPES.map(t => (
                  <button key={t.id} onClick={() => setWallType(t.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={wallType === t.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {t.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Pattern Repeat</h2>
              </div>
              <div className="p-4 space-y-2">
                {REPEAT_TYPES.map(r => (
                  <button key={r.id} onClick={() => setRepeatType(r.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={repeatType === r.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {r.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Ceiling Height</h2>
              </div>
              <div className="p-4">
                <div className="flex gap-2">
                  {HEIGHTS.map(h => (
                    <button key={h} onClick={() => setHeight(h)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={height === h ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      {h} ft
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Room Dimensions</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                <p className="text-xs text-slate-400">For one accent wall only: enter the wall width as Length, leave Width at 0.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Deductions</h2>
              </div>
              <div className="p-4 space-y-3">
                {([["Doors (21 sq ft each)", doors, setDoors], ["Windows (15 sq ft each)", windows, setWindows]] as const).map(([label, val, setter]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setter(Math.max(0, val - 1))}
                        className="w-7 h-7 rounded-lg border-2 border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center"
                        style={{ lineHeight: 1 }}>−</button>
                      <span className="w-6 text-center font-black text-slate-800">{val}</span>
                      <button onClick={() => setter(val + 1)}
                        className="w-7 h-7 rounded-lg border-2 text-white font-bold text-sm flex items-center justify-center"
                        style={{ backgroundColor: GREEN, borderColor: GREEN, lineHeight: 1 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="text-4xl mb-4">🌸</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your room dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Wall area (net)</div>
                      <div className="text-3xl font-black">{result.netArea} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black">{result.rolls}</div>
                      <div className="text-xs text-green-300">rolls needed</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {result.perimeter} ft perimeter · {height} ft ceiling · {Math.round(repeat.waste * 100)}% waste allowance
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
