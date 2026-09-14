"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

const GREEN = "#1B4332";
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
const INITIAL_AREAS: Area[] = [{ id: "area-0", length: "10", width: "10" }];
let nextAreaId = 1;
const newArea = (): Area => ({ id: `area-${nextAreaId++}`, length: "", width: "" });


// 100 sq ft at the default 10% waste, using the same per-tile square footage as
// TILE_SIZES above, so the table cannot drift from the tool.
const TILE_EXAMPLES: [string, string, string][] = [
  ['12" × 12"', "1.00 sq ft", "110"],
  ['18" × 18"', "2.25 sq ft", "49"],
  ['24" × 24"', "4.00 sq ft", "28"],
  ['6" × 6"', "0.25 sq ft", "440"],
  ['3" × 6" subway', "0.125 sq ft", "880"],
  ['4" × 4"', "0.111 sq ft", "991"],
];

function calc(areas: Area[], tileSizeId: string, waste: number, groutLine: number) {
  const tileSize = TILE_SIZES.find(t => t.id === tileSizeId)!;
  const totalSqFt = areas.reduce((sum, a) => sum + (parseFloat(a.length) || 0) * (parseFloat(a.width) || 0), 0);
  // Multiply before dividing, and round off the float dust before ceil():
  // totalSqFt * (1 + waste/100) turns a clean 110 into 110.00000000000001,
  // which rounds an extra tile (and an extra box) onto every tidy number.
  const withWaste = (totalSqFt * (100 + waste)) / 100;
  const tileCount = Math.ceil(Number((withWaste / tileSize.sqFt).toFixed(6)));
  const groutBags = Math.ceil(totalSqFt / 50); // 1 bag per ~50 sqft
  const adhesiveBags = Math.ceil(totalSqFt / 40); // 1 bag per ~40 sqft
  return { totalSqFt: Math.round(totalSqFt), withWaste: Math.round(withWaste), tileCount, groutBags, adhesiveBags, tileSize };
}

export default function TileCalculator() {
  const [areas, setAreas] = useState<Area[]>(INITIAL_AREAS);
  const [tileSizeId, setTileSizeId] = useState("12x12");
  const [waste, setWaste] = useState(10);
  const [groutLine, setGroutLine] = useState(3);
  const [surface, setSurface] = useState<"floor" | "wall">("floor");
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
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides/best-tile-for-bathroom-floor" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Buying Guide</a>
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
              <button onClick={() => setAreas(prev => [...prev, newArea()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}>
                + Add another area
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
                    <p className="text-xs text-amber-700">Grout haze remover — after grouting, a film forms on tile faces that's hard to remove once it hardens. Get it while you're at the store.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Supporting content ── */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              The waste factor is about your layout, not your skill
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Ten percent is the right allowance for a straight grid in a room with square corners. It is the
              wrong allowance for most other jobs, and the difference is geometry rather than carelessness.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li>
                <span className="font-semibold text-slate-700">Diagonal, 15 percent.</span> Every tile on the
                perimeter is cut corner to corner into two triangles, and only one of them usually fits
                somewhere else.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Herringbone or chevron, 15 to 20 percent.</span>{" "}
                Nearly every edge tile is a cut, and the offcuts rarely match the next gap.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Large format, add more again.</span> A botched
                cut on a 24 × 24 costs four square feet. The same mistake on a 12 × 12 costs one.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Awkward rooms.</span> Alcoves, jogs, a kitchen
                island, anything that turns one perimeter into five.
              </li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              The waste control above defaults to 10 and goes to 20. Set it before you look at the tile count,
              not after.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Grout joint width is decided by the tile, not by taste
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Rectified tile has its edges mechanically ground square after firing, so every piece is
              effectively the same size. That is what allows a tight joint — down to about 1/16 inch. Tile
              that is not rectified comes out of the kiln with real variation between pieces, and a joint
              around 3/16 inch is what hides it. Try to run a tight line with non-rectified tile and the
              grout lines visibly wander within a few rows, which cannot be corrected afterwards.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              The joint width then picks the grout. Unsanded below 1/8 inch, sanded at 1/8 and above — the
              sand is what gives a wider joint enough compressive strength not to crack. The exception is
              soft or polished faces, marble and glass especially, where sand can scratch the surface during
              grouting. Use unsanded or a specialty grout there and follow the tile maker&apos;s guidance over any
              general rule.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Trowel notch size moves the mortar count more than anything else
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              This calculator allows one 50 lb bag per 40 square feet. That figure assumes a 1/4 inch
              square-notch trowel, which is the normal choice for tile up to around 12 × 12. Step up to
              large-format tile and you step up the notch — a 1/2 inch notch lays roughly twice the mortar
              per square foot, so the same room can need close to double the bags. Buy accordingly if you are
              setting 18 × 18 or larger.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              The thing to check is contact, not thickness. Industry guidance is 80 percent mortar coverage
              behind a tile in a dry area and 95 percent in a shower or outdoors. Set your first few tiles,
              pull one straight back up, and look at the back. Ridges with bare gaps between them mean the
              notch is too small or the mortar skinned over before the tile went down.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Order one dye lot, and keep a box
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Tile is fired in batches and the colour shifts between them. Order the whole job at once and
              check that every box carries the same lot number before you open any of them — a top-up
              ordered a week later can arrive visibly different under the same light. Keep a spare box after
              the job, somewhere dry. A cracked tile in three years is a twenty-minute repair if you have a
              match and a floor-wide problem if you do not.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              One more check before you buy: the PEI rating. I and II are rated for walls and light duty
              only, III suits a normal residential floor, IV and V are built for heavy traffic. Putting wall
              tile on a floor is the common expensive mistake — it is thinner and softer, and it crazes
              underfoot. The other direction is fine, weight and substrate permitting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              Tiles needed for 100 square feet
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              At the standard 10 percent waste. Every figure is this page&apos;s own formula applied to the
              stated tile size.
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span>Tile size</span>
                <span className="flex gap-8">
                  <span className="w-24 text-right">Each covers</span>
                  <span className="w-20 text-right">Tiles</span>
                </span>
              </div>
              {TILE_EXAMPLES.map(([size, covers, count], i) => (
                <div
                  key={size}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                >
                  <span className="text-slate-600">{size}</span>
                  <span className="flex gap-8">
                    <span className="w-24 text-right text-slate-600">{covers}</span>
                    <span className="w-20 text-right font-bold text-slate-800">{count}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {FAQS.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-bold text-slate-800 text-sm mb-1.5">{faq.question}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Written and maintained by the{" "}
              <a href="/about" className="font-semibold underline" style={{ color: GREEN }}>
                BuildGuiders team
              </a>
              . Counts use nominal tile dimensions and standard trade coverage rates; mortar coverage and
              grout guidance follow published industry practice, and your tile maker&apos;s instructions take
              precedence over any of it. Product recommendations are researched and compared against
              manufacturer specifications and verified buyer feedback — we do not test tile.
            </p>
          </section>
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
