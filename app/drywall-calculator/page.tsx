"use client";
import { useState, useMemo } from "react";

const GREEN = "#1B4332";
const AMAZON_TAG = "buildguiders-20";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const SHEET_SQ_FT = 32; // 4x8 sheet
const DOOR_AREA = 20;
const WINDOW_AREA = 15;

interface Room { id: string; length: string; width: string; height: string; doors: string; windows: string; }
const defaultRoom = (): Room => ({ id: crypto.randomUUID(), length: "", width: "", height: "", doors: "1", windows: "1" });

function calc(rooms: Room[], includeCeiling: boolean, thickness: string) {
  let wallSqFt = 0;
  let ceilingSqFt = 0;
  for (const r of rooms) {
    const l = parseFloat(r.length) || 0;
    const w = parseFloat(r.width) || 0;
    const h = parseFloat(r.height) || 8;
    const doors = parseInt(r.doors) || 0;
    const windows = parseInt(r.windows) || 0;
    wallSqFt += 2 * (l + w) * h - doors * DOOR_AREA - windows * WINDOW_AREA;
    if (includeCeiling) ceilingSqFt += l * w;
  }
  const totalSqFt = wallSqFt + ceilingSqFt;
  const sheets = Math.ceil(totalSqFt / SHEET_SQ_FT * 1.10); // 10% waste
  const screwBoxes = Math.ceil(sheets / 5); // 1 box per 5 sheets
  const mudBuckets = Math.ceil(totalSqFt / 400); // 1 bucket per 400 sqft
  // Each sheet has ~16 ft of net seams; a 75-ft roll covers ~4-5 sheets
  const tapeBags = Math.ceil(sheets / 4); // 1 roll (75 ft) per 4 sheets
  const cornerBead = Math.ceil(rooms.reduce((sum, r) => sum + (parseFloat(r.height) || 8), 0) * 4 / rooms.length / 8); // rough estimate
  return { totalSqFt: Math.round(totalSqFt), wallSqFt: Math.round(wallSqFt), ceilingSqFt: Math.round(ceilingSqFt), sheets, screwBoxes, mudBuckets, tapeBags, cornerBead };
}

export default function DrywallCalculator() {
  const [rooms, setRooms] = useState<Room[]>([defaultRoom()]);
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [thickness, setThickness] = useState("1/2");
  const [calculated, setCalculated] = useState(false);
  const result = useMemo(() => calc(rooms, includeCeiling, thickness), [rooms, includeCeiling, thickness]);
  const hasInput = rooms.some(r => parseFloat(r.length) > 0 && parseFloat(r.width) > 0);

  const shoppingItems = [
    { qty: result.sheets, name: `${thickness}" Drywall Sheets (4×8)`, note: `${result.sheets} sheets — includes 10% waste for cuts`, tip: "Tip: Order delivery for large quantities. Carrying drywall through doorways is how backs get hurt.", amazon: aUrl("B07BFHQT4Z"), hd: hdUrl(`${thickness} drywall sheet 4x8`) },
    { qty: result.screwBoxes, name: "Drywall Screws (1-5/8\", 1 lb box)", note: `${result.screwBoxes} boxes — coarse thread for wood studs, fine thread for metal`, amazon: aUrl("B07BGPBF5Z"), hd: hdUrl("drywall screws 1-5/8") },
    { qty: result.mudBuckets, name: "Joint Compound — All-Purpose (3.5 gal bucket)", note: `${result.mudBuckets} buckets — for taping, topping, and final coats`, tip: "Tip: Apply 3 thin coats, not 1 thick one. Sand lightly between coats.", amazon: aUrl("B003KQCLW4"), hd: hdUrl("joint compound all purpose 3.5 gallon") },
    { qty: result.tapeBags, name: "Paper Drywall Tape (75 ft roll)", note: `${result.tapeBags} rolls — paper tape is stronger than mesh for seams`, tip: "Tip: Embed tape in wet mud, then scrape flat — no bubbles.", amazon: aUrl("B000BPCB4E"), hd: hdUrl("paper drywall tape") },
    { qty: result.cornerBead, name: "Metal Corner Bead (8 ft)", note: "Protects every outside corner — required for a clean finish", amazon: aUrl("B001BCB1QA"), hd: hdUrl("metal corner bead 8 ft") },
    { qty: 1, name: "Drywall Sanding Sponge + Pole Sander", note: "Wet sponge for detail, pole sander for flats — get both", amazon: aUrl("B07RJPD2MW"), hd: hdUrl("drywall sanding sponge pole sander") },
    { qty: 1, name: "Drywall Primer", note: "Prime before painting — raw drywall soaks paint unevenly", amazon: aUrl("B000BQKFQO"), hd: hdUrl("drywall primer") },
    { qty: 1, name: "Drywall T-Square (4 ft)", note: "Straight cuts across full sheets — worth every penny", amazon: aUrl("B0001YVMIA"), hd: hdUrl("drywall t-square 4 ft") },
    { qty: 1, name: "Drywall Screw Gun Bit (magnetic)", note: "Sets screws to the right depth without tearing paper — get the dimpler bit", amazon: aUrl("B00004TUTP"), hd: hdUrl("drywall screw dimpler bit") },
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
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🧱</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Drywall Calculator</h1>
              <p className="text-slate-500 mt-1">Sheet count, compound, tape, screws — the full mudding kit.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Options</h2></div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Thickness</label>
                  <div className="flex gap-2">
                    {[["1/2", "1/2\" (standard)"], ["5/8", "5/8\" (fire-rated)"], ["3/8", "3/8\" (repair)"]].map(([val, label]) => (
                      <button key={val} onClick={() => setThickness(val)} className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                        style={thickness === val ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input type="checkbox" checked={includeCeiling} onChange={() => setIncludeCeiling(v => !v)} className="sr-only" />
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                      style={includeCeiling ? { backgroundColor: GREEN, borderColor: GREEN } : { backgroundColor: "#fff", borderColor: "#cbd5e1" }}>
                      {includeCeiling && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Include ceiling</div>
                    <div className="text-xs text-slate-400">Uncheck if ceiling is already drywalled</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {rooms.map((room, i) => (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Room {rooms.length > 1 ? i + 1 : ""}</h2>
                    {rooms.length > 1 && <button onClick={() => setRooms(prev => prev.filter(x => x.id !== room.id))} className="text-xs text-red-400 font-medium">Remove</button>}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[{ field: "length", label: "Length (ft)" }, { field: "width", label: "Width (ft)" }, { field: "height", label: "Height (ft)", placeholder: "8" }, { field: "doors", label: "Doors", placeholder: "1" }, { field: "windows", label: "Windows", placeholder: "1" }].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder={placeholder ?? "0"} value={(room as any)[field]}
                          onChange={e => setRooms(prev => prev.map(x => x.id === room.id ? { ...x, [field]: e.target.value } : x))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${GREEN}`} onBlur={e => e.target.style.boxShadow = "none"} style={{ outline: "none" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setRooms(prev => [...prev, defaultRoom()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another room
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
                <div className="text-4xl mb-4">🧱</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your room dimensions and click Calculate.</p>
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
                      <div><div className="text-3xl font-black">{result.sheets}</div><div className="text-xs text-green-300">sheets</div></div>
                      <div><div className="text-3xl font-black">{result.mudBuckets}</div><div className="text-xs text-green-300">mud buckets</div></div>
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
                    <p className="text-xs text-amber-700">Rent a drywall lift for ceilings. Holding a 70 lb sheet overhead while screwing it in is how injuries happen. HD rents lifts for about $50/day.</p>
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
