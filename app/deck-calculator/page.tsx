"use client";
import { useState, useMemo } from "react";

const GREEN = "#1B4332";
const AMAZON_TAG = "buildguiders-20";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

// ── Calculation engine ────────────────────────────────────────────────────────
function calcDeck({
  deckL, deckW, boardWidth, postSpacing, boardType, ledgerAttached,
  deckHeight, includeStairs, stairWidth, includeRailing,
}: {
  deckL: number; deckW: number; boardWidth: number; postSpacing: number;
  boardType: string; ledgerAttached: boolean; deckHeight: number;
  includeStairs: boolean; stairWidth: number; includeRailing: boolean;
}) {
  const deckSqFt = deckL * deckW;
  const boardWidthFt = boardWidth / 12;

  // ── Decking boards ──────────────────────────────────────────────────────────
  const totalBoardRows = Math.ceil(deckW / boardWidthFt);
  const deckingBoards = Math.ceil(totalBoardRows * (deckL / 8) * 1.10); // +10% waste

  // ── Joists (true 16" OC = 1.333 ft) ────────────────────────────────────────
  const joists = Math.ceil(deckL / 1.333) + (ledgerAttached ? 1 : 2);

  // ── Beam (doubled 2×10, spanning deck length at outer post row) ────────────
  // One beam at far end; for decks >12 ft wide, add intermediate beam
  const beamRows = deckW > 12 ? 2 : 1;
  const beamBoardsPerRow = Math.ceil(deckL / 8) * 2; // doubled lumber
  const beamBoards = beamRows * beamBoardsPerRow;

  // ── Posts (perimeter only) ──────────────────────────────────────────────────
  let posts: number;
  if (ledgerAttached) {
    const postsOnFarSide = Math.ceil(deckL / postSpacing) + 1;
    const postsOnEachShortSide = Math.max(1, Math.ceil(deckW / postSpacing) - 1);
    posts = postsOnFarSide + postsOnEachShortSide * 2;
  } else {
    const postsAlongLength = Math.ceil(deckL / postSpacing) + 1;
    const postsAlongWidth = Math.max(0, Math.ceil(deckW / postSpacing) - 1);
    posts = postsAlongLength * 2 + postsAlongWidth * 2;
  }

  const concreteBags = posts * 2;
  const screwLbs = Math.max(1, Math.ceil(deckSqFt / 50));
  const jostHangers = joists * 2;

  // ── Ledger (if house-attached) ──────────────────────────────────────────────
  const ledgerBoards = ledgerAttached ? Math.ceil(deckL / 8) : 0;
  const lagBolts = ledgerAttached ? Math.ceil((deckL * 12) / 16) * 2 : 0; // double-staggered every 16"

  // ── Stairs ──────────────────────────────────────────────────────────────────
  let stairSteps = 0, stairStringers = 0, stairTreadBoards = 0, stairConcreteBags = 0;
  let stairStringerLengthFt = 0;

  if (includeStairs && deckHeight > 0) {
    stairSteps = Math.ceil(deckHeight / 7.5);         // 7.5" rise per step (code standard)
    const totalRunIn = stairSteps * 10;               // 10" tread depth (code minimum)
    stairStringerLengthFt = Math.ceil(
      Math.sqrt(deckHeight * deckHeight + totalRunIn * totalRunIn) / 12 + 1
    ); // hypotenuse + 1 ft for cuts
    stairStringers = stairWidth <= 36 ? 3 : 4;       // 3 stringers ≤36", 4 for 48"
    stairTreadBoards = stairSteps * 2;                // 2 × 2×6 boards per tread
    stairConcreteBags = 2;                            // small landing pad at base
  }

  // ── Railing & Balusters ─────────────────────────────────────────────────────
  let railingLinearFt = 0, balusters = 0, railPosts = 0, railTopRailBoards = 0, railPostCaps = 0;

  if (includeRailing) {
    // Railing perimeter: ledger = 3 open sides, freestanding = 4 sides
    // Subtract stair opening (3 ft default)
    const stairOpening = includeStairs ? 3 : 0;
    if (ledgerAttached) {
      railingLinearFt = Math.round(deckL * 2 + deckW - stairOpening);
    } else {
      railingLinearFt = Math.round((deckL + deckW) * 2 - stairOpening);
    }

    // Balusters: max 4" gap, 2×2 actual width = 1.5"
    // Per linear foot: 12 / (1.5 + 4) = 2.18 → use ceil per total inches
    balusters = Math.ceil((railingLinearFt * 12) / (1.5 + 4));

    // Rail posts every 6 ft along railing run
    railPosts = Math.ceil(railingLinearFt / 6) + 1;

    // Top rail + bottom rail boards (2×4, 8 ft lengths)
    railTopRailBoards = Math.ceil(railingLinearFt / 8) * 2; // top + bottom rail

    // Post caps for railing posts
    railPostCaps = railPosts;

    // Stair balusters (both sides of stair stringer if stairs included)
    if (includeStairs && deckHeight > 0) {
      const stairRailRun = stairStringerLengthFt * 2; // both sides
      balusters += Math.ceil((stairRailRun * 12) / (1.5 + 4));
    }
  }

  return {
    deckSqFt: Math.round(deckSqFt),
    deckingBoards, joists, beamBoards, beamRows,
    posts, concreteBags, screwLbs, jostHangers,
    ledgerBoards, lagBolts,
    stairSteps, stairStringers, stairTreadBoards, stairConcreteBags,
    stairStringerLengthFt,
    railingLinearFt, balusters, railPosts, railTopRailBoards, railPostCaps,
  };
}

// ── Item component ────────────────────────────────────────────────────────────
function Item({ qty, name, note, tip, amazon, hd }: {
  qty: number; name: string; note: string; tip?: string; amazon: string; hd: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-800">{qty}</div>
        <div>
          <div className="font-bold text-slate-800 text-sm">{name}</div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{note}</p>
          {tip && <p className="text-xs text-amber-600 mt-1 leading-snug">{tip}</p>}
        </div>
      </div>
      <div className="flex gap-2 ml-11">
        <a href={amazon} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
        <a href={hd} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#F96302" }}>Home Depot</a>
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

// ── Toggle component ──────────────────────────────────────────────────────────
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
export default function DeckCalculator() {
  const [deckL, setDeckL] = useState("");
  const [deckW, setDeckW] = useState("");
  const [deckHeight, setDeckHeight] = useState("");
  const [boardWidth, setBoardWidth] = useState(5.5);
  const [postSpacing, setPostSpacing] = useState(8);
  const [boardType, setBoardType] = useState("pressure-treated");
  const [ledgerAttached, setLedgerAttached] = useState(true);
  const [includeStairs, setIncludeStairs] = useState(false);
  const [stairWidth, setStairWidth] = useState(36);
  const [includeRailing, setIncludeRailing] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    const l = parseFloat(deckL);
    const w = parseFloat(deckW);
    if (!l || !w) return null;
    return calcDeck({
      deckL: l, deckW: w, boardWidth, postSpacing, boardType, ledgerAttached,
      deckHeight: parseFloat(deckHeight) || 0,
      includeStairs, stairWidth, includeRailing,
    });
  }, [deckL, deckW, deckHeight, boardWidth, postSpacing, boardType, ledgerAttached, includeStairs, stairWidth, includeRailing]);

  const hasInput = !!result;

  const requiresRailing = parseFloat(deckHeight) >= 30; // code: railing required ≥30" above grade

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
      <header style={{ background: GREEN }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🪚</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Deck Calculator</h1>
              <p className="text-slate-500 mt-1">Boards, beam, joists, posts, stairs, spindles — the complete material list for a code-compliant deck.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Dimensions */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Deck Dimensions</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  ["deckL", "Length (ft)", deckL, setDeckL],
                  ["deckW", "Width (ft)", deckW, setDeckW],
                  ["deckHeight", "Height above ground (in)", deckHeight, setDeckHeight],
                ].map(([key, label, val, setter]: any) => (
                  <div key={key} className={key === "deckHeight" ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                    <input type="number" min="0" placeholder="0" value={val} onChange={e => setter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                      onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                    {key === "deckHeight" && <p className="text-xs text-slate-400 mt-1">Used for post length, stair steps, and railing code check. Railing required ≥30".</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Deck Type */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Deck Type</h2></div>
              <div className="p-4 space-y-2">
                {[[true, "Attached to house", "Ledger board bolted to rim joist"], [false, "Freestanding", "Posts on all four sides"]].map(([val, label, sub]) => (
                  <button key={String(val)} onClick={() => setLedgerAttached(val as boolean)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={ledgerAttached === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {label as string} <span className="text-xs opacity-70 block">{sub as string}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Board Type */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Board Type</h2></div>
              <div className="p-4 space-y-2">
                {[["pressure-treated", "Pressure-Treated Wood", "Most common, lowest cost"], ["composite", "Composite Decking", "Low maintenance, higher cost"]].map(([val, label, sub]) => (
                  <button key={val} onClick={() => setBoardType(val)} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={boardType === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {label} <span className="text-xs opacity-70 block">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Framing Options */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Framing Options</h2></div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Board Width</label>
                  <div className="flex gap-2">
                    {[[5.5, "5.5\" (std)"], [3.5, "3.5\""], [6, "6\""]].map(([val, label]) => (
                      <button key={String(val)} onClick={() => setBoardWidth(val as number)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={boardWidth === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Post Spacing</label>
                  <div className="flex gap-2">
                    {[[6, "6 ft"], [8, "8 ft"], [10, "10 ft"]].map(([val, label]) => (
                      <button key={String(val)} onClick={() => setPostSpacing(val as number)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={postSpacing === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">8 ft max in most jurisdictions — verify local code</p>
                </div>
              </div>
            </div>

            {/* Stairs */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Stairs</h2></div>
              <div className="p-4 space-y-4">
                <Toggle label="Include stair materials" sub="Stringers, treads, and landing pad" checked={includeStairs} onChange={() => setIncludeStairs(v => !v)} />
                {includeStairs && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stair Width</label>
                    <div className="flex gap-2">
                      {[[36, "36\" (std)"], [48, "48\" (wide)"]].map(([val, label]) => (
                        <button key={String(val)} onClick={() => setStairWidth(val as number)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                          style={stairWidth === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Uses deck height to calculate steps at 7.5" rise (code standard)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Railing */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Railing & Spindles</h2>
                {requiresRailing && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>Code required</span>}
              </div>
              <div className="p-4 space-y-3">
                <Toggle
                  label="Include railing + baluster materials"
                  sub={requiresRailing ? "Required by code for decks ≥30\" above grade" : "Optional for low decks — recommended for safety"}
                  checked={includeRailing}
                  onChange={() => setIncludeRailing(v => !v)}
                />
                {includeRailing && (
                  <p className="text-xs text-slate-400 leading-relaxed">Calculates balusters at max 4" spacing (IRC code), top + bottom rail, and rail posts every 6 ft. Stair railing included if stairs selected.</p>
                )}
              </div>
            </div>

            <button onClick={() => setCalculated(true)} disabled={!hasInput} className="w-full py-3.5 text-white font-bold rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GREEN; }}>
              Calculate & Build My List →
            </button>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="lg:col-span-3 space-y-4">
            {!calculated || !result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🪚</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your deck dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Deck area</div>
                      <div className="text-3xl font-black">{result.deckSqFt} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-center">
                      <div><div className="text-2xl font-black">{result.deckingBoards}</div><div className="text-xs text-green-300">deck boards</div></div>
                      <div><div className="text-2xl font-black">{result.posts}</div><div className="text-xs text-green-300">posts</div></div>
                      <div><div className="text-2xl font-black">{result.concreteBags}</div><div className="text-xs text-green-300">concrete bags</div></div>
                      {includeStairs && result.stairSteps > 0 && <div><div className="text-2xl font-black">{result.stairSteps}</div><div className="text-xs text-green-300">steps</div></div>}
                      {includeRailing && <div><div className="text-2xl font-black">{result.balusters}</div><div className="text-xs text-green-300">balusters</div></div>}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300 flex flex-wrap gap-3">
                    <span>{result.joists} joists at 16" OC</span>
                    <span>·</span>
                    <span>{result.beamBoards} beam boards ({result.beamRows === 2 ? "2 beam rows" : "1 beam row"})</span>
                    {ledgerAttached && <><span>·</span><span>{result.lagBolts} lag bolts</span></>}
                    {includeRailing && <><span>·</span><span>{result.railingLinearFt} ft of railing</span></>}
                  </div>
                </div>

                {/* Shopping List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-800">Your Shopping List</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Complete material list — one trip</p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* Decking */}
                    <SectionHeader title="Decking Surface" />
                    <Item qty={result.deckingBoards} name={`${boardType === "composite" ? "Composite" : "Pressure-Treated"} Decking Boards (8 ft)`}
                      note={`${result.deckingBoards} boards — includes 10% waste for end cuts`}
                      tip="Tip: Let PT boards acclimate on-site 48 hours. Composite boards can be installed immediately."
                      amazon={aUrl("B07BFYJ8ZQ")} hd={hdUrl(`${boardType} deck boards 8 ft`)} />
                    <Item qty={result.screwLbs} name={'Deck Screws (3", coated, 1 lb box)'}
                      note={`${result.screwLbs} lb — coated screws resist corrosion and won't stain PT lumber`}
                      tip="Tip: Pre-drill near board ends to prevent splitting."
                      amazon={aUrl("B07J3LZHVH")} hd={hdUrl("deck screws coated 3 inch")} />

                    {/* Framing */}
                    <SectionHeader title="Framing" />
                    <Item qty={result.joists} name="2×8 Pressure-Treated Joists (8 ft)"
                      note={`${result.joists} joists at true 16" on center + ${ledgerAttached ? "1" : "2"} rim joist${ledgerAttached ? "" : "s"}`}
                      amazon={aUrl("B01MU3FVZR")} hd={hdUrl("2x8 pressure treated joist lumber")} />
                    <Item qty={result.beamBoards} name="2×10 Pressure-Treated Beam Boards (8 ft)"
                      note={`${result.beamBoards} boards — ${result.beamRows === 2 ? "2 doubled beams" : "1 doubled beam"} spanning deck length. Beam runs perpendicular to joists, sits on posts.`}
                      tip="Tip: Beams are doubled 2×10s bolted together. Size up to 2×12 for spans over 10 ft between posts."
                      amazon={aUrl("B01MU3FVZR")} hd={hdUrl("2x10 pressure treated beam lumber")} />
                    <Item qty={result.jostHangers} name="Joist Hangers — Galvanized"
                      note={`${result.jostHangers} hangers — one each end of each joist`}
                      tip="Tip: Only use galvanized or stainless hardware with PT lumber — plain steel corrodes within 2 years."
                      amazon={aUrl("B07B44H5RW")} hd={hdUrl("joist hangers galvanized 2x8")} />
                    <Item qty={1} name="Post Cap Hardware (bag)"
                      note="Caps connect posts to beam — required for structural stability"
                      amazon={aUrl("B00004RFN0")} hd={hdUrl("post cap hardware 4x4")} />
                    <Item qty={1} name="Construction Adhesive"
                      note="Seal beam-to-post connections before bolting"
                      amazon={aUrl("B00002NA0C")} hd={hdUrl("construction adhesive liquid nails")} />

                    {/* Posts & Foundation */}
                    <SectionHeader title="Posts & Foundation" />
                    <Item qty={result.posts} name="4×4 Pressure-Treated Posts"
                      note={`${result.posts} posts — add 2+ ft to deck height for below-grade burial`}
                      tip="Tip: Burial depth must be below your local frost line — typically 36–42\" in cold climates. Check local code."
                      amazon={aUrl("B01N3VKDIH")} hd={hdUrl("4x4 pressure treated post 8 ft")} />
                    <Item qty={result.concreteBags} name="Quikrete 80 lb Concrete Bags"
                      note={`${result.concreteBags} bags — 2 bags per post hole`}
                      tip="Tip: Dry-pour method works great for fence posts — pour dry, add water, tamp. No mixer needed."
                      amazon={aUrl("B00H4ZPCW0")} hd={hdUrl("quikrete 80 lb fast setting concrete")} />

                    {/* Ledger (if house-attached) */}
                    {ledgerAttached && (
                      <>
                        <SectionHeader title="Ledger Attachment" />
                        <Item qty={result.ledgerBoards} name="2×8 Pressure-Treated Ledger Board (8 ft)"
                          note={`${result.ledgerBoards} boards — bolts to house rim joist, replaces the house-side rim joist`}
                          tip="CRITICAL: Ledger must bolt to house structural rim joist — not siding, sheathing, or trim. Improper ledger attachment is the #1 cause of deck collapses."
                          amazon={aUrl("B01MU3FVZR")} hd={hdUrl("2x8 pressure treated ledger board")} />
                        <Item qty={result.lagBolts} name="1/2\" × 3\" Lag Bolts + Washers (box)"
                          note={`${result.lagBolts} lag bolts — double-staggered every 16" along ledger length`}
                          tip="Tip: LedgerLOK structural screws are a code-approved alternative — no pre-drilling, faster install."
                          amazon={aUrl("B07B44H5RX")} hd={hdUrl("lag bolts 1/2 inch deck ledger")} />
                      </>
                    )}

                    {/* Stairs */}
                    {includeStairs && result.stairSteps > 0 && (
                      <>
                        <SectionHeader title={`Stairs — ${result.stairSteps} Steps`} />
                        <Item qty={result.stairStringers} name={`2×12 Pressure-Treated Stair Stringers (${result.stairStringerLengthFt} ft)`}
                          note={`${result.stairStringers} stringers for ${stairWidth}" wide stairs — ${result.stairSteps} steps at 7.5" rise, 10" tread`}
                          tip="Tip: Buy pre-cut stringers from HD if available — saves hours of layout work."
                          amazon={aUrl("B07BFYJ8ZQ")} hd={hdUrl("2x12 pressure treated stair stringer")} />
                        <Item qty={result.stairTreadBoards} name="2×6 Pressure-Treated Tread Boards (8 ft)"
                          note={`${result.stairTreadBoards} boards — 2 boards per tread, ${result.stairSteps} treads total`}
                          tip="Tip: Leave a 1/4\" gap between tread boards for drainage."
                          amazon={aUrl("B01MU3FVZR")} hd={hdUrl("2x6 pressure treated deck boards stair tread")} />
                        <Item qty={1} name="Stair Stringer Bracket Kit"
                          note="Connects stringers to deck frame and to bottom landing — prevents movement"
                          amazon={aUrl("B00004RFN2")} hd={hdUrl("stair stringer bracket connector")} />
                        <Item qty={result.stairConcreteBags} name="80 lb Concrete Bags (landing pad)"
                          note={`${result.stairConcreteBags} bags for a small concrete landing pad at stair base`}
                          tip="Tip: A concrete landing pad prevents the stringers from sitting on bare ground and rotting."
                          amazon={aUrl("B00H4ZPCW0")} hd={hdUrl("quikrete concrete stair landing")} />
                      </>
                    )}

                    {/* Railing & Balusters */}
                    {includeRailing && (
                      <>
                        <SectionHeader title={`Railing & Spindles — ${result.railingLinearFt} ft`} />
                        <Item qty={result.balusters} name="2×2 Pressure-Treated Balusters (36\" or 42\")"
                          note={`${result.balusters} balusters — max 4" spacing (IRC code: a 4" sphere cannot pass through)`}
                          tip="Tip: Buy 5–10 extra. Balusters crack during installation and you'll want spares for future repairs."
                          amazon={aUrl("B07N5VXPLD")} hd={hdUrl("2x2 pressure treated baluster spindle 36 inch")} />
                        <Item qty={result.railTopRailBoards} name="2×4 Pressure-Treated Rail Boards (8 ft)"
                          note={`${result.railTopRailBoards} boards — top rail + bottom rail for ${result.railingLinearFt} ft of railing`}
                          tip="Tip: Top rail height must be 36\" for decks under 6 ft high, 42\" for decks 6 ft and above."
                          amazon={aUrl("B01MU3FVZR")} hd={hdUrl("2x4 pressure treated railing top rail")} />
                        <Item qty={result.railPosts} name="4×4 Railing Posts (42\" or 48\")"
                          note={`${result.railPosts} rail posts — one every 6 ft along railing run. Through-bolt to deck frame.`}
                          tip="Tip: Rail posts must bolt through the rim joist with carriage bolts — do not toe-screw or surface-mount only."
                          amazon={aUrl("B01N3VKDIH")} hd={hdUrl("4x4 railing post 42 inch pressure treated")} />
                        <Item qty={result.railPostCaps} name="Post Caps (decorative or flat)"
                          note={`${result.railPostCaps} caps — keeps water out of end grain, extends post life significantly`}
                          amazon={aUrl("B00004RFN0")} hd={hdUrl("post cap railing 4x4 deck")} />
                        <Item qty={Math.ceil(result.railPosts / 2)} name="Carriage Bolts (1/2\" × 5\", with nuts + washers)"
                          note="Through-bolt each rail post to rim joist — 2 bolts per post"
                          amazon={aUrl("B07B44H5RW")} hd={hdUrl("carriage bolts 1/2 inch 5 inch deck railing")} />
                      </>
                    )}

                    {/* Tools & Misc */}
                    <SectionHeader title="Tools & Miscellaneous" />
                    <Item qty={1} name="Speed Square + Chalk Line"
                      note="Keep boards straight and square — you'll use both constantly"
                      amazon={aUrl("B000077GZY")} hd={hdUrl("speed square chalk line set")} />
                    <Item qty={1} name="Post Base Hardware (bag)"
                      note="Adjustable post bases allow exact positioning before concrete sets"
                      amazon={aUrl("B00004RFN0")} hd={hdUrl("adjustable post base hardware 4x4")} />
                  </div>

                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Before you start</p>
                    <p className="text-xs text-amber-700">Pull a building permit — required for most decks over 200 sq ft or 30\" above grade. Call 811 before digging (free, required by law). Verify your post spacing and beam size with local code — spans vary by lumber species and load requirements.</p>
                  </div>
                </div>

                {/* How we calculated */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
                  <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                    <p>• Deck boards: rows × (length ÷ 8 ft boards) + 10% waste</p>
                    <p>• Joists: true 16" OC (1 per 1.333 ft) + {ledgerAttached ? "1 rim joist" : "2 rim joists"}</p>
                    <p>• Beam: doubled 2×10s, {result.beamRows} beam row{result.beamRows > 1 ? "s" : ""} (extra row for decks over 12 ft wide)</p>
                    <p>• Posts: perimeter only — {ledgerAttached ? "3 open sides (house side uses ledger)" : "all 4 sides"}</p>
                    <p>• Concrete: 2 × 80 lb bags per post hole</p>
                    <p>• Screws: 1 lb per 50 sq ft (industry standard)</p>
                    {includeStairs && result.stairSteps > 0 && <p>• Stairs: {result.stairSteps} steps at 7.5" rise, 10" tread, {result.stairStringers} stringers</p>}
                    {includeRailing && <p>• Balusters: max 4" gap, 1.5" wide — {result.balusters} total across {result.railingLinearFt} ft of railing</p>}
                    {ledgerAttached && <p>• Lag bolts: double-staggered every 16" along {Math.ceil(parseFloat(deckL) || 0)} ft ledger</p>}
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
