"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
const hdUrl = (q: string) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`;

const SHEET_SQ_FT = 32; // 4x8 sheet

// Screw length follows board thickness: the screw has to bite at least 5/8"
// into the framing. Hardcoding one length contradicted the supporting content,
// which is the sort of thing that costs a reader.
const SCREW_LENGTH: Record<string, string> = {
  "3/8": '1-1/4"',
  "1/2": '1-1/4"',
  "5/8": '1-5/8"',
};
const DOOR_AREA = 20;
const WINDOW_AREA = 15;

interface Room { id: string; length: string; width: string; height: string; doors: string; windows: string; }

// The first room is a fixed, populated example so the shopping list is in the
// server-rendered HTML. A crawler never presses Calculate, so an empty initial
// state meant the page's entire output was invisible to Google.
// Its id is a literal, not crypto.randomUUID(): a random id (or a counter that
// survives across server requests) renders different markup on the server and
// the client and breaks hydration.
const INITIAL_ROOMS: Room[] = [{ id: "room-0", length: "12", width: "12", height: "8", doors: "1", windows: "1" }];

let nextRoomId = 1;
const newRoom = (): Room => ({ id: `room-${nextRoomId++}`, length: "", width: "", height: "", doors: "1", windows: "1" });


// Walls + ceiling at 8 ft, one door and one window, 10% waste — computed with
// the calc() above so the table cannot drift from the tool.
const SHEET_EXAMPLES: [string, string, string][] = [
  ["10 × 10 ft", "385 sq ft", "14"],
  ["12 × 12 ft", "493 sq ft", "17"],
  ["12 × 16 ft", "605 sq ft", "21"],
  ["14 × 16 ft", "669 sq ft", "23"],
  ["16 × 20 ft", "861 sq ft", "30"],
  ["20 × 24 ft", "1,149 sq ft", "40"],
];

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
  // 10% waste. Multiply before dividing and round off the float dust before
  // ceil(): a 320 sq ft total gives 11.000000000000002 and buys a 12th sheet.
  const sheets = Math.ceil(Number(((totalSqFt * 110) / 100 / SHEET_SQ_FT).toFixed(6)));
  const screwBoxes = Math.ceil(sheets / 5); // 1 box per 5 sheets
  const mudBuckets = Math.ceil(totalSqFt / 400); // 1 bucket per 400 sqft
  // Each sheet has ~16 ft of net seams; a 75-ft roll covers ~4-5 sheets
  const tapeBags = Math.ceil(sheets / 4); // 1 roll (75 ft) per 4 sheets
  const cornerBead = Math.ceil(rooms.reduce((sum, r) => sum + (parseFloat(r.height) || 8), 0) * 4 / rooms.length / 8); // rough estimate
  return { totalSqFt: Math.round(totalSqFt), wallSqFt: Math.round(wallSqFt), ceilingSqFt: Math.round(ceilingSqFt), sheets, screwBoxes, mudBuckets, tapeBags, cornerBead };
}

export default function DrywallCalculator() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [thickness, setThickness] = useState("1/2");
  const result = useMemo(() => calc(rooms, includeCeiling, thickness), [rooms, includeCeiling, thickness]);
  const hasInput = rooms.some(r => parseFloat(r.length) > 0 && parseFloat(r.width) > 0);

  const shoppingItems = [
    { qty: result.sheets, name: `${thickness}" Drywall Sheets (4×8)`, note: `${result.sheets} sheets — includes 10% waste for cuts`, tip: "Tip: Order delivery for large quantities. Carrying drywall through doorways is how backs get hurt.", amazon: aUrl("B07BFHQT4Z"), hd: hdUrl(`${thickness} drywall sheet 4x8`) },
    { qty: result.screwBoxes, name: `Drywall Screws (${SCREW_LENGTH[thickness]}, 1 lb box)`, note: `${result.screwBoxes} boxes — ${SCREW_LENGTH[thickness]} for ${thickness}" board, coarse thread for wood studs and fine thread for metal`, amazon: aUrl("B07BGPBF5Z"), hd: hdUrl(`drywall screws ${SCREW_LENGTH[thickness]}`) },
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
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Guides</a>
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
              <button onClick={() => setRooms(prev => [...prev, newRoom()])} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
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
                <div className="text-4xl mb-4">🧱</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter a room length and width to see it.</p>
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
                    <p className="text-xs text-amber-700">Rent a drywall lift for ceilings. Holding a 70 lb sheet overhead while screwing it in is how injuries happen. HD rents lifts for about $50/day.</p>
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
              Sheet length decides how much finishing you do
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Drywall has tapered long edges — a shallow recess milled into the face so that tape and
              compound sit flush instead of proud. Seams along those edges disappear with a normal three-coat
              finish. The cut ends have no taper. Butt two of them together and you have a seam standing
              proud of the surface, which has to be built up on both sides and feathered out 16 to 24 inches
              to become invisible under a raking light.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              That is the whole argument for long sheets. A 4 × 12 board spans most residential walls in one
              piece and gives you zero butt joints. Two 4 × 8 sheets on the same wall give you one, plus the
              hour of feathering and sanding that goes with it. Hanging horizontally — the long edge running
              across the studs — also puts the tapered seam at a comfortable 4 ft working height instead of
              running vertical seams floor to ceiling.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              This calculator works in 32 square feet per sheet, the 4 × 8 size, because that is what fits in
              a vehicle and what two people can carry up a stairwell. If you are having board delivered, ask
              for 12-footers and divide the square footage by 48 instead.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Half-inch is the default, and the exceptions matter
            </h2>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li>
                <span className="font-semibold text-slate-700">1/2 inch</span> — the residential standard for
                walls, and for ceilings where the joists are 16 inches on centre.
              </li>
              <li>
                <span className="font-semibold text-slate-700">5/8 inch Type X</span> — where fire resistance
                is required. In US residential code the usual case is the garage side of a garage-to-house
                wall and the ceiling below habitable space. It is also the right call on any ceiling framed
                at 24 inches on centre, because half-inch board sags between joists over time, and faster
                with insulation resting on it. Requirements vary by jurisdiction, so check local code rather
                than this page.
              </li>
              <li>
                <span className="font-semibold text-slate-700">3/8 and 1/4 inch</span> — patching and curved
                walls. Not for general hanging; they are too floppy to stay flat between studs.
              </li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thickness does not change the sheet count, only the weight and the price. A 4 × 8 sheet of
              5/8 runs noticeably heavier than 1/2, which is worth knowing before you plan a ceiling as a
              two-person job.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              The openings you deduct do not actually save you board
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              This calculator subtracts 20 square feet per door and 15 per window, which is the right way to
              estimate the finished surface. It is not how the board gets used. Almost nobody cuts a sheet to
              fit around a door before hanging it — you hang straight over the opening, screw off the field,
              then run a saw around the frame from behind. It is faster, the edges land exactly on the
              opening, and the cut-out is usually scrap.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              So treat the deduction as an estimate of area, not of sheets saved, and leave the 10 percent
              waste factor alone. Raise it to 15 percent if the room has a lot of angles, a stairwell, a
              vaulted ceiling, or more openings than a normal bedroom — those are the jobs where offcuts pile
              up faster than you can use them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              What the compound, tape and screw quantities assume
            </h2>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li>
                <span className="font-semibold text-slate-700">Joint compound:</span> one bucket per 400
                square feet of board, enough for a three-coat finish — a bedding coat over the tape, a fill
                coat, and a thin skim. Buy a bag of setting-type compound as well if you have butt joints or
                deep gaps to build up: it hardens chemically rather than by drying, shrinks less, and lets
                you recoat the same day.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Tape:</span> one 75 ft roll per four sheets.
                Paper tape on flats and inside corners — it is stronger in tension and creases cleanly. Mesh
                is faster but needs setting-type compound over it, because premixed all-purpose does not
                develop enough strength to stop a mesh seam cracking.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Screws:</span> one box per five sheets. The
                spec is every 16 inches along each framing member on walls and every 12 inches on ceilings —
                about 32 screws in a 4 × 8 wall sheet. Length follows the board, because the screw needs to
                bite at least 5/8 inch into the framing: 1-1/4 inch for 3/8 and 1/2 inch board, 1-5/8 inch
                for 5/8. The shopping list above switches with the thickness you pick. Coarse thread in
                wood, fine thread in steel studs, and set them just below the paper without breaking it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              Sheets needed by room size
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Walls and ceiling, 8 ft ceiling height, one door and one window, 10 percent waste included.
              Every figure is this page&apos;s own formula applied to the stated room.
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span>Room</span>
                <span className="flex gap-8">
                  <span className="w-24 text-right">Area</span>
                  <span className="w-20 text-right">4 × 8 sheets</span>
                </span>
              </div>
              {SHEET_EXAMPLES.map(([room, area, sheets], i) => (
                <div
                  key={room}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                >
                  <span className="text-slate-600">{room}</span>
                  <span className="flex gap-8">
                    <span className="w-24 text-right text-slate-600">{area}</span>
                    <span className="w-20 text-right font-bold text-slate-800">{sheets}</span>
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
              . Quantities use standard sheet sizes and trade coverage rates; fire-rating and framing
              requirements come from the US residential code and vary locally, so confirm yours before you
              buy. Product recommendations are researched and compared against manufacturer specifications
              and verified buyer feedback — we do not test drywall.
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
