"use client";

import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  length: string;
  width: string;
  height: string;
  doors: string;
  windows: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note: string;
  tip?: string;
  amazonUrl: string;
  hdUrl: string;
  category: "paint" | "primer" | "tools" | "prep";
}

// ── Constants ────────────────────────────────────────────────────────────────
const PAINT_COVERAGE = 400;
const PRIMER_COVERAGE = 300;
const DOOR_AREA = 20;
const WINDOW_AREA = 15;

const AMAZON_TAG = "buildguiders-20";
const HD_BASE = "https://www.homedepot.com/s/";

function amazonUrl(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

function hdUrl(query: string) {
  return `${HD_BASE}${encodeURIComponent(query)}`;
}

// ── Calculator Logic ─────────────────────────────────────────────────────────
function calcPaint(rooms: Room[], coats: number, includePrimer: boolean, wallsOnly: boolean) {
  let totalSqFt = 0;
  for (const r of rooms) {
    const l = parseFloat(r.length) || 0;
    const w = parseFloat(r.width) || 0;
    const h = parseFloat(r.height) || 8;
    const doors = parseInt(r.doors) || 0;
    const windows = parseInt(r.windows) || 0;
    const wallArea = 2 * (l + w) * h;
    const ceilingArea = wallsOnly ? 0 : l * w;
    const deductions = doors * DOOR_AREA + windows * WINDOW_AREA;
    totalSqFt += wallArea + ceilingArea - deductions;
  }
  const paintGallons = Math.ceil((totalSqFt * coats) / PAINT_COVERAGE);
  const primerGallons = includePrimer ? Math.ceil(totalSqFt / PRIMER_COVERAGE) : 0;
  return { totalSqFt: Math.round(totalSqFt), paintGallons, primerGallons };
}

function buildShoppingList(paintGallons: number, primerGallons: number): ShoppingItem[] {
  const items: ShoppingItem[] = [];

  if (paintGallons > 0) {
    items.push({ id: "paint", name: "Interior Paint", quantity: paintGallons, unit: paintGallons === 1 ? "gallon" : "gallons", note: `${paintGallons} gal covers your surface area with your chosen coat count`, tip: "Tip: Buy the same batch number (lot) to avoid sheen variation between cans.", amazonUrl: amazonUrl("B07CKVX9CG"), hdUrl: hdUrl("interior paint gallon"), category: "paint" });
  }
  if (primerGallons > 0) {
    items.push({ id: "primer", name: "Interior Primer", quantity: primerGallons, unit: primerGallons === 1 ? "gallon" : "gallons", note: "Seals the surface for better color coverage and adhesion", tip: "Tip: Tint your primer to match the topcoat — reduces coats needed.", amazonUrl: amazonUrl("B000BQKFQO"), hdUrl: hdUrl("interior primer gallon"), category: "primer" });
  }

  const rollerCovers = Math.max(2, Math.ceil(paintGallons / 2));
  items.push({ id: "roller-covers", name: "Roller Covers (3/8\" nap)", quantity: rollerCovers, unit: "covers", note: "3/8\" nap for smooth/eggshell walls. Use 1/2\" for textured walls.", tip: "Tip: Don't wash rollers between coats — wrap in plastic wrap overnight.", amazonUrl: amazonUrl("B00002N8OZ"), hdUrl: hdUrl("roller cover 3/8 nap"), category: "tools" });
  items.push({ id: "roller-frame", name: "9\" Roller Frame", quantity: 1, unit: "frame", note: "Standard 9\" frame fits all standard covers", amazonUrl: amazonUrl("B00004TUTY"), hdUrl: hdUrl("9 inch roller frame"), category: "tools" });
  items.push({ id: "roller-tray", name: "Paint Tray + Liners", quantity: 1, unit: "set", note: "Liners make cleanup fast — swap instead of wash", amazonUrl: amazonUrl("B003DXBRDM"), hdUrl: hdUrl("paint tray liners"), category: "tools" });
  items.push({ id: "angled-brush", name: "2.5\" Angled Sash Brush", quantity: 1, unit: "brush", note: "For cutting in at edges, corners, and trim", tip: "Tip: Cut in one wall at a time, then roll before it dries for seamless blending.", amazonUrl: amazonUrl("B00022AEBU"), hdUrl: hdUrl("2.5 inch angled sash brush"), category: "tools" });
  items.push({ id: "painters-tape", name: "Painter's Tape (1.5\")", quantity: Math.max(2, Math.ceil(paintGallons / 3)), unit: "rolls", note: "Blue tape for trim, outlets, and ceiling lines", tip: "Tip: Remove tape while paint is still slightly wet for clean lines.", amazonUrl: amazonUrl("B00004Z4CP"), hdUrl: hdUrl("painter's tape 1.5 inch"), category: "prep" });
  items.push({ id: "drop-cloth", name: "Canvas Drop Cloth (9×12 ft)", quantity: Math.max(1, Math.ceil(paintGallons / 4)), unit: "cloth", note: "Canvas stays put and won't slip like plastic sheeting", amazonUrl: amazonUrl("B00000J1EZ"), hdUrl: hdUrl("canvas drop cloth 9x12"), category: "prep" });
  items.push({ id: "extension-pole", name: "Extension Pole (4–8 ft)", quantity: 1, unit: "pole", note: "Saves your back on ceilings and high walls — don't skip this", tip: "Tip: Attach roller to pole at a slight downward angle to avoid splattering.", amazonUrl: amazonUrl("B00004TUTZ"), hdUrl: hdUrl("paint roller extension pole"), category: "tools" });

  return items;
}

// ── Badge ────────────────────────────────────────────────────────────────────
function CategoryBadge({ cat }: { cat: ShoppingItem["category"] }) {
  const map = {
    paint: { label: "Paint", color: "bg-amber-50 text-amber-700 border-amber-200" },
    primer: { label: "Primer", color: "bg-blue-50 text-blue-700 border-blue-200" },
    tools: { label: "Tool", color: "bg-slate-100 text-slate-600 border-slate-200" },
    prep: { label: "Prep", color: "bg-green-50 text-green-700 border-green-200" },
  };
  const { label, color } = map[cat];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${color}`}>{label}</span>;
}

const defaultRoom = (): Room => ({ id: crypto.randomUUID(), length: "", width: "", height: "", doors: "1", windows: "1" });

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PaintCalculatorPage() {
  const [rooms, setRooms] = useState<Room[]>([defaultRoom()]);
  const [coats, setCoats] = useState(2);
  const [includePrimer, setIncludePrimer] = useState(true);
  const [wallsOnly, setWallsOnly] = useState(false);
  const [surfaceType, setSurfaceType] = useState<"smooth" | "textured">("smooth");
  const [calculated, setCalculated] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calcPaint(rooms, coats, includePrimer, wallsOnly), [rooms, coats, includePrimer, wallsOnly]);
  const shoppingList = useMemo(() => buildShoppingList(result.paintGallons, result.primerGallons), [result]);
  const hasValidInput = rooms.some(r => parseFloat(r.length) > 0 && parseFloat(r.width) > 0);

  function updateRoom(id: string, field: keyof Room, value: string) {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function handleCopyList() {
    const lines = ["🎨 Paint Shopping List — BuildGuiders.com", `Surface area: ${result.totalSqFt} sq ft`, "", ...shoppingList.map(i => `☐ ${i.quantity} ${i.unit} — ${i.name}  ${i.note}`), "", "Generated at buildguiders.com/paint-calculator"];
    navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>

      {/* Header */}
      <header style={{ background: "#1B4332" }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none", letterSpacing: "-0.5px" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a href="/" className="font-medium transition-colors" style={{ color: "#86efac" }}>← Home</a>
            <a href="/#calculators" className="font-medium transition-colors" style={{ color: "#86efac" }}>All Calculators</a>
          <a href="/guides/best-interior-paint" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Buying Guide</a>
          </nav>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-2xl">🖌️</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">Paint Calculator</h1>
              <p className="text-slate-500 mt-1 text-base">Enter your room dimensions and get an exact shopping list — one trip, not four.</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {["No signup", "Waste factor included", "Full shopping list"].map(label => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Options</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Number of coats</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                      <button key={n} onClick={() => setCoats(n)} className="flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all"
                        style={coats === n ? { backgroundColor: "#1B4332", color: "#fff", borderColor: "#1B4332" } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {n} coat{n > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  {coats === 1 && <p className="text-xs text-amber-600 mt-1.5">⚠ One coat rarely gives full coverage on patched walls.</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Wall texture</label>
                  <div className="flex gap-2">
                    {[["smooth", "Smooth"], ["textured", "Textured"]].map(([val, label]) => (
                      <button key={val} onClick={() => setSurfaceType(val as "smooth" | "textured")} className="flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all"
                        style={surfaceType === val ? { backgroundColor: "#1B4332", color: "#fff", borderColor: "#1B4332" } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  {[
                    { id: "primer", label: "Include primer", sub: "Recommended for new drywall, dark colors, or color changes", checked: includePrimer, onChange: () => setIncludePrimer(v => !v) },
                    { id: "walls", label: "Walls only (skip ceiling)", sub: "Check if ceiling is already painted or different color", checked: wallsOnly, onChange: () => setWallsOnly(v => !v) },
                  ].map(({ id, label, sub, checked, onChange }) => (
                    <label key={id} className="flex items-start gap-3 cursor-pointer">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                          style={checked ? { backgroundColor: "#1B4332", borderColor: "#1B4332" } : { backgroundColor: "#fff", borderColor: "#cbd5e1" }}>
                          {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{label}</div>
                        <div className="text-xs text-slate-400 leading-tight">{sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rooms.map((room, i) => (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 text-sm">Room {rooms.length > 1 ? i + 1 : ""}</h2>
                    {rooms.length > 1 && <button onClick={() => setRooms(prev => prev.filter(r => r.id !== room.id))} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[{ field: "length", label: "Length (ft)" }, { field: "width", label: "Width (ft)" }, { field: "height", label: "Height (ft)", placeholder: "8" }, { field: "doors", label: "Doors", placeholder: "1" }, { field: "windows", label: "Windows", placeholder: "1" }].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input type="number" min="0" placeholder={placeholder ?? "0"} value={(room as any)[field]} onChange={e => updateRoom(room.id, field as keyof Room, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
                          style={{ outline: "none" }} onFocus={e => e.target.style.boxShadow = "0 0 0 2px #1B4332"} onBlur={e => e.target.style.boxShadow = "none"} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setRooms(prev => [...prev, defaultRoom()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold transition-all"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1B4332"; e.currentTarget.style.color = "#1B4332"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another room
              </button>
            </div>

            <button onClick={() => setCalculated(true)} disabled={!hasValidInput} className="w-full py-3.5 text-white font-bold rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: "#1B4332" }}
              onMouseEnter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.backgroundColor = "#14532d"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#1B4332"; }}>
              Calculate & Build My List →
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {!calculated || !hasValidInput ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">🪣</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">Enter your room dimensions on the left and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: "#1B4332" }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total surface area</div>
                      <div className="text-3xl font-black mt-0.5">{result.totalSqFt.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center"><div className="text-2xl font-black">{result.paintGallons}</div><div className="text-xs text-green-300 font-medium">gal paint</div></div>
                      {result.primerGallons > 0 && <div className="text-center"><div className="text-2xl font-black">{result.primerGallons}</div><div className="text-xs text-green-300 font-medium">gal primer</div></div>}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {PAINT_COVERAGE} sq ft/gal · {coats} coat{coats > 1 ? "s" : ""} · doors and windows deducted
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-slate-800">Your Shopping List</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Everything you need — one trip</p>
                    </div>
                    <button onClick={handleCopyList} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all"
                      style={copied ? { background: "#f0fdf4", borderColor: "#4ade80", color: "#166534" } : { background: "#fff", borderColor: "#e2e8f0", color: "#475569" }}>
                      {copied ? "✓ Copied!" : "Copy list"}
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shoppingList.map(item => (
                      <div key={item.id} className="px-5 py-4">
                        <div className="flex items-start gap-3 min-w-0 mb-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                              <CategoryBadge cat={item.category} />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.note}</p>
                            {item.tip && <p className="text-xs text-amber-600 mt-1 leading-snug">{item.tip}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-11">
                          <a href={item.amazonUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: "#FF9900" }}>Amazon</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      <div>
                        <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">Don't forget at the register</div>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">Check if you need wood filler or spackle for nail holes, a putty knife, and a sanding block. Most forgotten trip #2 causes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
                  <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                    <p>• Wall area = 2 × (length + width) × ceiling height</p>
                    {!wallsOnly && <p>• Ceiling area = length × width</p>}
                    <p>• Door deductions: {DOOR_AREA} sq ft each · Window deductions: {WINDOW_AREA} sq ft each</p>
                    <p>• Paint coverage: {PAINT_COVERAGE} sq ft per gallon · Primer: {PRIMER_COVERAGE} sq ft per gallon</p>
                    <p>• Results rounded up to nearest whole gallon</p>
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
          <p className="text-xs text-slate-300 max-w-sm text-center sm:text-right">Earns from qualifying purchases via Amazon Associates and affiliate programs. Never affects our calculations.</p>
        </div>
      </footer>
    </div>
  );
}
