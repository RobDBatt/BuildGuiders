"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

// ── Coverage rates (sq ft per gallon) ────────────────────────────────────────
const STAIN_TYPES = [
  {
    id: "semi-transparent",
    label: "Semi-Transparent",
    sub: "Shows wood grain — most popular",
    newWoodCoverage: 150,   // porous new wood soaks up more
    oldWoodCoverage: 250,   // sealed/previously stained
  },
  {
    id: "solid",
    label: "Solid Color",
    sub: "Hides grain — better for weathered wood",
    newWoodCoverage: 200,
    oldWoodCoverage: 300,
  },
  {
    id: "sealer",
    label: "Clear Sealer / Water Repellent",
    sub: "Preserves natural look — reapply yearly",
    newWoodCoverage: 200,
    oldWoodCoverage: 400,
  },
];

const WOOD_CONDITIONS = [
  { id: "new", label: "New / Unfinished Wood", sub: "Never been stained or sealed", needsPrep: false, newWood: true },
  { id: "weathered", label: "Weathered / Grayed", sub: "Old, dry, or previously bare wood", needsPrep: true, newWood: false },
  { id: "previously-stained", label: "Previously Stained", sub: "Has existing stain or sealer", needsPrep: true, newWood: false },
  { id: "freshly-cleaned", label: "Clean & Prepped", sub: "Already cleaned and brightened", needsPrep: false, newWood: false },
];

// ── Calculation engine ────────────────────────────────────────────────────────
function calcStain({
  deckL, deckW, coats, stainTypeId, conditionId,
  includeRailing, railingLinearFt, railStyle,
  includeSteps, stepCount, stepWidth,
}: {
  deckL: number; deckW: number; coats: number;
  stainTypeId: string; conditionId: string;
  includeRailing: boolean; railingLinearFt: number; railStyle: string;
  includeSteps: boolean; stepCount: number; stepWidth: number;
}) {
  const stainType = STAIN_TYPES.find(s => s.id === stainTypeId)!;
  const condition = WOOD_CONDITIONS.find(c => c.id === conditionId)!;
  const coverage = condition.newWood ? stainType.newWoodCoverage : stainType.oldWoodCoverage;

  // ── Surface areas ──────────────────────────────────────────────────────────
  const floorSqFt = deckL * deckW;

  // Railing surface area:
  // Open spindles: each linear foot = ~4 sq ft (both sides of rails + spindle faces)
  // Solid boards: each linear foot = ~2 sq ft (both sides of boards)
  let railingSqFt = 0;
  if (includeRailing && railingLinearFt > 0) {
    railingSqFt = railStyle === "open" ? railingLinearFt * 4 : railingLinearFt * 2;
  }

  // Steps: tread + riser per step, times width
  // Tread = 10" deep = 0.833 ft; riser = 7.5" = 0.625 ft
  let stepsSqFt = 0;
  if (includeSteps && stepCount > 0) {
    const treadSqFt = (stepWidth / 12) * 0.833;
    const riserSqFt = (stepWidth / 12) * 0.625;
    stepsSqFt = stepCount * (treadSqFt + riserSqFt) * 2; // both sides × 2 for stringer faces
  }

  const totalSqFt = floorSqFt + railingSqFt + stepsSqFt;

  // ── Stain gallons ──────────────────────────────────────────────────────────
  const gallonsPerCoat = Math.ceil(totalSqFt / coverage);
  const totalGallons = gallonsPerCoat * coats;

  // ── Prep products ──────────────────────────────────────────────────────────
  // 1 bottle deck cleaner per ~300 sq ft of floor area (less on railings)
  const cleanerBottles = condition.needsPrep ? Math.max(1, Math.ceil(floorSqFt / 300)) : 0;
  const brightenBottles = condition.id === "weathered" ? Math.max(1, Math.ceil(floorSqFt / 400)) : 0;

  return {
    floorSqFt: Math.round(floorSqFt),
    railingSqFt: Math.round(railingSqFt),
    stepsSqFt: Math.round(stepsSqFt),
    totalSqFt: Math.round(totalSqFt),
    coverage,
    gallonsPerCoat,
    totalGallons,
    cleanerBottles,
    brightenBottles,
    condition,
    stainType,
  };
}

// ── Item component ────────────────────────────────────────────────────────────
function Item({ qty, unit = "", name, note, tip, amazon, hd }: {
  qty: number; unit?: string; name: string; note: string; tip?: string; amazon: string; hd: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-800 leading-none">
          <span>{qty}</span>
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm">{name}{unit ? ` (${unit})` : ""}</div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{note}</p>
          {tip && <p className="text-xs text-amber-600 mt-1 leading-snug">{tip}</p>}
        </div>
      </div>
      <div className="flex gap-2 ml-11">
        <a href={amazon} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-2 bg-slate-50 border-t border-b border-slate-100">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
          style={checked ? { backgroundColor: GREEN, borderColor: GREEN } : { backgroundColor: "#fff", borderColor: "#cbd5e1" }}>
          {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        {sub && <div className="text-xs text-slate-400 leading-tight">{sub}</div>}
      </div>
    </label>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DeckStainCalculator() {
  const [deckL, setDeckL] = useState("16");
  const [deckW, setDeckW] = useState("12");
  const [coats, setCoats] = useState(2);
  const [stainTypeId, setStainTypeId] = useState("semi-transparent");
  const [conditionId, setConditionId] = useState("weathered");
  const [includeRailing, setIncludeRailing] = useState(true);
  const [railingLinearFt, setRailingLinearFt] = useState("40");
  const [railStyle, setRailStyle] = useState("open");
  const [includeSteps, setIncludeSteps] = useState(false);
  const [stepCount, setStepCount] = useState("3");
  const [stepWidth, setStepWidth] = useState(36);
  const result = useMemo(() => {
    const l = parseFloat(deckL);
    const w = parseFloat(deckW);
    if (!l || !w) return null;
    return calcStain({
      deckL: l, deckW: w, coats, stainTypeId, conditionId,
      includeRailing, railingLinearFt: parseFloat(railingLinearFt) || 0, railStyle,
      includeSteps, stepCount: parseInt(stepCount) || 0, stepWidth,
    });
  }, [deckL, deckW, coats, stainTypeId, conditionId, includeRailing, railingLinearFt, railStyle, includeSteps, stepCount, stepWidth]);

  const hasInput = !!result;
  const isNewWood = WOOD_CONDITIONS.find(c => c.id === conditionId)?.newWood;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides/best-deck-stain-and-sealer" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Buying Guide</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🖌️</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Deck Stain Calculator</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>Maintenance</span>
              </div>
              <p className="text-slate-500">How many gallons you actually need — including railings. The part everyone under-buys.</p>
            </div>
          </div>
        </div>
      </div>

      {/* New wood warning */}
      {isNewWood && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4 flex gap-3">
            <span className="text-amber-500 text-lg mt-0.5">⚠</span>
            <div>
              <div className="font-bold text-amber-900 text-sm">New pressure-treated wood needs to wait before staining</div>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                PT lumber is wet from the treatment process and needs 6–12 months to dry before stain will penetrate properly.
                Apply stain too early and it won't soak in — it'll peel within a season. Test readiness by sprinkling water
                on the wood: if it beads up, wait longer. If it soaks in, you're ready.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Deck dimensions */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Deck Floor Area</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[["deckL", "Length (ft)", deckL, setDeckL], ["deckW", "Width (ft)", deckW, setDeckW]].map(([key, label, val, setter]: any) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                    <input type="number" min="0" placeholder="0" value={val} onChange={e => setter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                      onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Wood condition */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Wood Condition</h2>
              </div>
              <div className="p-4 space-y-2">
                {WOOD_CONDITIONS.map(c => (
                  <button key={c.id} onClick={() => setConditionId(c.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={conditionId === c.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {c.label} <span className="text-xs opacity-70 block">{c.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stain type */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Stain Type</h2>
              </div>
              <div className="p-4 space-y-2">
                {STAIN_TYPES.map(s => (
                  <button key={s.id} onClick={() => setStainTypeId(s.id)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={stainTypeId === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label} <span className="text-xs opacity-70 block">{s.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coats */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Number of Coats</h2>
              </div>
              <div className="p-4">
                <div className="flex gap-2">
                  {[1, 2].map(n => (
                    <button key={n} onClick={() => setCoats(n)} className="flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all"
                      style={coats === n ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                      {n} coat{n > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">New/bare wood always needs 2 coats. Previously stained in good condition may only need 1.</p>
              </div>
            </div>

            {/* Railings */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Railings</h2>
              </div>
              <div className="p-4 space-y-4">
                <Toggle label="Include railing stain" sub="Railings add significantly more surface area than most people expect" checked={includeRailing} onChange={() => setIncludeRailing(v => !v)} />
                {includeRailing && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Total Railing Linear Feet</label>
                      <input type="number" min="0" placeholder="e.g. 60" value={railingLinearFt} onChange={e => setRailingLinearFt(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                        onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                      <p className="text-xs text-slate-400 mt-1">Measure total linear feet of all railing sections</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Railing Style</label>
                      <div className="flex gap-2">
                        {[["open", "Open Spindles", "~4 sq ft/linear ft"], ["solid", "Solid Boards", "~2 sq ft/linear ft"]].map(([val, label, sub]) => (
                          <button key={val} onClick={() => setRailStyle(val)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all text-left px-2"
                            style={railStyle === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                            {label} <span className="block text-xs opacity-70">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Stairs</h2>
              </div>
              <div className="p-4 space-y-4">
                <Toggle label="Include stair staining" sub="Treads, risers, and stringer faces" checked={includeSteps} onChange={() => setIncludeSteps(v => !v)} />
                {includeSteps && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Number of Steps</label>
                      <input type="number" min="0" placeholder="0" value={stepCount} onChange={e => setStepCount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                        onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stair Width</label>
                      <div className="flex gap-2">
                        {[[36, "36\""], [48, "48\""]].map(([val, label]) => (
                          <button key={String(val)} onClick={() => setStepWidth(val as number)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                            style={stepWidth === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
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

          {/* ── RIGHT: Results ── */}
          <div className="lg:col-span-3 space-y-4" id="shopping-list">
            {!result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🖌️</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">Enter your deck dimensions and click Calculate. Don't forget to include railings — that's where most people run out of stain.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total surface area</div>
                      <div className="text-3xl font-black">{result.totalSqFt.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black">{result.totalGallons}</div>
                      <div className="text-xs text-green-300 font-medium">{coats === 1 ? "gallon" : "total gallons"}{result.totalGallons !== 1 ? "s" : ""}</div>
                      {coats === 2 && <div className="text-xs text-green-400 mt-0.5">{result.gallonsPerCoat} gal × {coats} coats</div>}
                    </div>
                  </div>
                  {/* Surface area breakdown */}
                  <div className="mt-3 pt-3 border-t border-green-700 grid grid-cols-3 gap-2 text-xs text-green-300">
                    <div>
                      <div className="font-bold text-green-100">{result.floorSqFt} sq ft</div>
                      <div>floor</div>
                    </div>
                    {result.railingSqFt > 0 && (
                      <div>
                        <div className="font-bold text-green-100">{result.railingSqFt} sq ft</div>
                        <div>railings</div>
                      </div>
                    )}
                    {result.stepsSqFt > 0 && (
                      <div>
                        <div className="font-bold text-green-100">{result.stepsSqFt} sq ft</div>
                        <div>stairs</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-green-400">
                    Coverage rate: {result.coverage} sq ft/gallon for {result.stainType.label.toLowerCase()} on {result.condition.label.toLowerCase()}
                  </div>
                </div>

                {/* Railing callout if significant */}
                {result.railingSqFt > result.floorSqFt * 0.3 && (
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-4 flex gap-3">
                    <span className="text-blue-500 text-lg">💡</span>
                    <div>
                      <div className="font-bold text-blue-900 text-sm">Railings are {Math.round(result.railingSqFt / result.totalSqFt * 100)}% of your total surface area</div>
                      <p className="text-xs text-blue-700 mt-1">This is why most people run out of stain — the railings add up fast. We've included them in your gallon count.</p>
                    </div>
                  </div>
                )}

                {/* Shopping List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-800">Your Shopping List</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Based on the dimensions on the left — edit them to match your project and this updates as you type.</p>

                    <p className="text-xs text-slate-400 mt-0.5">{result.totalGallons} gallons · {result.totalSqFt} sq ft — one trip</p>
                  </div>
                  <div className="divide-y divide-slate-100">

                    {/* Prep products (if needed) */}
                    {(result.cleanerBottles > 0 || result.brightenBottles > 0) && (
                      <>
                        <SectionHeader title="Prep — Clean Before You Stain" />
                        {result.cleanerBottles > 0 && (
                          <Item qty={result.cleanerBottles} name="Deck Cleaner / Wood Wash"
                            note={`${result.cleanerBottles} bottle${result.cleanerBottles > 1 ? "s" : ""} — remove dirt, mildew, and gray oxidation before staining`}
                            tip="Tip: Apply with a stiff brush or pump sprayer, let sit 15 min, scrub, rinse thoroughly. Deck must dry 48 hours before staining."
                            amazon={aUrl("B000BN575E")} hd={hdUrl("deck cleaner wood wash")} />
                        )}
                        {result.brightenBottles > 0 && (
                          <Item qty={result.brightenBottles} name="Deck Brightener / Wood Brightener"
                            note={`${result.brightenBottles} bottle${result.brightenBottles > 1 ? "s" : ""} — neutralizes cleaner and opens wood grain for better stain penetration`}
                            tip="Tip: Brightener is the step most DIYers skip — it makes a huge difference in how evenly stain absorbs. Apply after cleaner rinses."
                            amazon={aUrl("B00A2ZZ5DK")} hd={hdUrl("deck brightener wood brightener")} />
                        )}
                      </>
                    )}

                    {/* Stain */}
                    <SectionHeader title="Stain / Sealer" />
                    <Item qty={result.totalGallons} unit="gallon"
                      name={`${result.stainType.label} Deck Stain`}
                      note={`${result.totalGallons} gallons at ${result.coverage} sq ft/gal — covers ${result.totalSqFt} sq ft in ${coats} coat${coats > 1 ? "s" : ""}`}
                      tip={coats === 2 ? "Tip: Let first coat dry completely (2–4 hours) before applying second coat. Don't rush this." : "Tip: Stir thoroughly — don't shake. Shaking creates air bubbles that leave marks."}
                      amazon={aUrl("B00KEMLQ5M")} hd={hdUrl(`${stainTypeId} deck stain gallon`)} />

                    {/* Application tools */}
                    <SectionHeader title="Application Tools" />
                    <Item qty={1} name="Pump Garden Sprayer (1–2 gallon)"
                      note="For spindles and balusters — spraying is 3-4x faster than brushing individual spindles"
                      tip="Tip: Spray spindles first, then back-brush immediately to work stain in and catch drips. One person sprays, one person brushes."
                      amazon={aUrl("B000H9GPKC")} hd={hdUrl("pump garden sprayer 2 gallon")} />
                    <Item qty={1} name={'4" Chip Brush (3-pack)'}
                      note="For edges, detail work, and back-brushing after spraying spindles"
                      tip="Tip: Chip brushes are cheap and disposable — much easier than cleaning stain out of a good brush."
                      amazon={aUrl("B07BFYQZ1X")} hd={hdUrl("chip brush 4 inch 3 pack stain")} />
                    <Item qty={1} name={'9" Roller + 3/8" Nap Cover + Extension Pole'}
                      note="For flat deck surface — rolling is much faster than brushing the floor"
                      tip="Tip: Roll in the direction of the boards, not across them. Work one board width at a time for consistent penetration."
                      amazon={aUrl("B00004TUTY")} hd={hdUrl("roller 9 inch 3/8 nap extension pole")} />
                    <Item qty={1} name="Roller Tray + Disposable Liners"
                      note="Liners make cleanup instant — swap instead of wash"
                      amazon={aUrl("B003DXBRDM")} hd={hdUrl("paint roller tray liners")} />

                    {/* Protection */}
                    <SectionHeader title="Protection & Cleanup" />
                    <Item qty={2} name="Canvas Drop Cloth"
                      note="Protect plants, furniture, and concrete below and around the deck"
                      tip="Tip: Move furniture completely off the deck — stain on fabric is permanent."
                      amazon={aUrl("B00000J1EZ")} hd={hdUrl("canvas drop cloth")} />
                    <Item qty={1} name={'Painter\'s Tape (2" wide)'}
                      note="Protect house siding and trim where deck meets the home"
                      amazon={aUrl("B00004Z4CP")} hd={hdUrl("painters tape 2 inch")} />
                    <Item qty={1} name="Nitrile Gloves (box of 100)"
                      note="Stain doesn't wash off skin — nitrile is chemical-resistant"
                      amazon={aUrl("B07GKH84FQ")} hd={hdUrl("nitrile gloves box")} />
                    <Item qty={1} name="Mineral Spirits (quart)"
                      note="For cleaning oil-based stain from brushes and sprayer. Skip for water-based stains."
                      amazon={aUrl("B000BN5FCO")} hd={hdUrl("mineral spirits quart")} />
                  </div>

                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1.5">Before you start</p>
                    <div className="space-y-1">
                      {[
                        "Check the forecast: need 24–48 hours of dry weather after application, and temps between 50–90°F",
                        "Start early in the morning — staining in direct afternoon sun causes lap marks and uneven drying",
                        "Sand rough spots with 80-grit before cleaning, especially board ends and splintered areas",
                        "Apply stain in the direction of the wood grain, not across it",
                        "Wipe up any puddles — don't let stain pool in low spots or between boards",
                      ].map(tip => (
                        <p key={tip} className="text-xs text-amber-700 flex gap-1.5"><span className="flex-shrink-0">•</span>{tip}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* How we calculated */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
                  <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                    <p>• Floor area: {result.floorSqFt} sq ft (length × width)</p>
                    {result.railingSqFt > 0 && <p>• Railing area: {result.railingSqFt} sq ft ({railStyle === "open" ? "open spindles × 4 sq ft per linear ft" : "solid boards × 2 sq ft per linear ft"})</p>}
                    {result.stepsSqFt > 0 && <p>• Stair area: {result.stepsSqFt} sq ft (treads + risers + stringer faces)</p>}
                    <p>• Coverage rate: {result.coverage} sq ft/gallon for {result.stainType.label.toLowerCase()} on {result.condition.label.toLowerCase()}</p>
                    <p>• Total: {result.totalSqFt} sq ft ÷ {result.coverage} = {result.gallonsPerCoat} gallon{result.gallonsPerCoat !== 1 ? "s" : ""} per coat × {coats} coat{coats > 1 ? "s" : ""} = {result.totalGallons} gallons total</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 BuildGuiders.com · Free home project calculators</p>
          <p className="text-xs text-slate-300 max-w-sm text-right">Earns from qualifying purchases via Amazon Associates and affiliate programs. Never affects our calculations.</p>
        </div>
      </footer>
    </div>
  );
}
