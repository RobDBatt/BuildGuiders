"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

const GREEN = "#1B4332";
const aUrl = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const SEED_TYPES = [
  { id: "new",      label: "New Lawn",      rate: 5, desc: "5 lbs per 1,000 sq ft" },
  { id: "overseed", label: "Overseeding",   rate: 3, desc: "3 lbs per 1,000 sq ft" },
  { id: "repair",   label: "Bare Patches",  rate: 4, desc: "4 lbs per 1,000 sq ft" },
];

const SUN_TYPES = [
  { id: "sun",   label: "Full Sun (6+ hrs/day)",  query: "full sun grass seed Scotts Pennington" },
  { id: "shade", label: "Shade (< 4 hrs/day)",    query: "shade grass seed tall fescue" },
  { id: "mixed", label: "Mixed Sun / Shade",      query: "sun shade grass seed mix" },
];


// New-lawn and overseeding rates from SEED_TYPES above, in the common 7 lb bag,
// so the table cannot drift from the tool.
const SEED_EXAMPLES: [string, string, string][] = [
  ["1,000 sq ft", "5 lb · 1 bag", "3 lb · 1 bag"],
  ["2,000 sq ft", "10 lb · 2 bags", "6 lb · 1 bag"],
  ["5,000 sq ft", "25 lb · 4 bags", "15 lb · 3 bags"],
  ["7,500 sq ft", "37.5 lb · 6 bags", "22.5 lb · 4 bags"],
  ["10,000 sq ft", "50 lb · 8 bags", "30 lb · 5 bags"],
  ["15,000 sq ft", "75 lb · 11 bags", "45 lb · 7 bags"],
];

function calc(sqft: number, rate: number) {
  const lbs       = (sqft / 1000) * rate;
  const bags7     = Math.ceil(lbs / 7);           // 7-lb bags (common Scotts / Pennington size)
  const fertBags  = Math.max(1, Math.ceil(sqft / 5000)); // starter fert covers 5,000 sq ft per bag
  const strawBags = Math.ceil(sqft / 250);         // seed accelerator mulch, ~250 sq ft per bag
  return {
    lbs:       Math.round(lbs * 10) / 10,
    bags7,
    fertBags,
    strawBags,
  };
}

export default function GrassSeedCalculator() {
  const [length,   setLength]   = useState("50");
  const [width,    setWidth]    = useState("40");
  const [seedType, setSeedType] = useState("new");
  const [sunType,  setSunType]  = useState("sun");
  const sqft    = (parseFloat(length) || 0) * (parseFloat(width) || 0);
  const hasInput = sqft > 0;
  const st  = SEED_TYPES.find(s => s.id === seedType)!;
  const sun = SUN_TYPES.find(s => s.id === sunType)!;
  const result = useMemo(() => calc(sqft, st.rate), [sqft, st.rate]);

  const shoppingItems = [
    {
      qty:  result.bags7,
      name: `Grass Seed — ${sun.label} (7-lb bags)`,
      note: `${result.lbs} lbs needed · ${result.bags7} × 7-lb bag${result.bags7 !== 1 ? "s" : ""}`,
      tip:  seedType === "new"
        ? "Tip: Rake soil to ¼\" depth before seeding. Seed-to-soil contact is the #1 factor in germination."
        : seedType === "overseed"
        ? "Tip: Mow existing lawn short (2\") before overseeding. Dethatch if thatch exceeds ½\"."
        : "Tip: Loosen bare soil 2–3\" deep before applying seed and press lightly — don't bury.",
      amazon: aUrl(sun.query),
    },
    {
      qty:  result.fertBags,
      name: "Starter Fertilizer for New Grass",
      note: `${result.fertBags} bag${result.fertBags !== 1 ? "s" : ""} — feeds seedlings for the first 6 weeks`,
      tip:  "Tip: Never use standard lawn fertilizer on new seed — high nitrogen burns seedlings. Use starter formula only.",
      amazon: aUrl("starter fertilizer new grass seed lawn"),
    },
    ...(seedType === "new" ? [{
      qty:  result.strawBags,
      name: "Seed Accelerator Straw Mulch",
      note: `Locks in moisture and protects seed from washing away — especially on slopes`,
      tip:  "Tip: Apply a thin, even layer — just enough to see 50% of the soil through it. Too thick and seed can't emerge.",
      amazon: aUrl("grass seed accelerator straw mulch EZ seed"),
    }] : []),
    {
      qty:  1,
      name: "Bow Rake (16-tine)",
      note: "For breaking up soil crust, working seed into the surface, and leveling topdressing",
      amazon: aUrl("bow rake garden 16 tine"),
    },
    {
      qty:  1,
      name: "Oscillating Lawn Sprinkler",
      note: "New seed needs light watering twice daily for 2–3 weeks. Covers 3,000–4,000 sq ft.",
      tip:  "Tip: Water lightly and frequently until germination — keep the top ½\" moist, not soggy.",
      amazon: aUrl("oscillating lawn sprinkler adjustable"),
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
          <a href="/calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← All Calculators</a>
          <a href="/guides" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}>Guides</a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🌱</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Grass Seed Calculator</h1>
              <p className="text-slate-500 mt-1">Pounds of seed, starter fertilizer, and supplies — for new lawns, overseeding, or bare patch repair.</p>
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
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Seeding Type</h2>
              </div>
              <div className="p-4 space-y-2">
                {SEED_TYPES.map(s => (
                  <button key={s.id} onClick={() => setSeedType(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={seedType === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Sun Condition</h2>
              </div>
              <div className="p-4 space-y-2">
                {SUN_TYPES.map(s => (
                  <button key={s.id} onClick={() => setSunType(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={sunType === s.id ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN } : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Lawn Area</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
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
              {sqft > 0 && <p className="px-4 pb-3 text-xs text-slate-400">{sqft.toLocaleString()} sq ft total</p>}
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

          {/* ── Results ── */}
          <div className="lg:col-span-3 space-y-4" id="shopping-list">
            {!hasInput ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="font-bold text-slate-700 text-lg">Your shopping list will appear here</h3>
                <p className="text-slate-400 text-sm mt-2">Enter your lawn dimensions and click Calculate.</p>
              </div>
            ) : (
              <>
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Lawn area</div>
                      <div className="text-3xl font-black">{sqft.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span></div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-3xl font-black">{result.lbs}</div>
                        <div className="text-xs text-green-300">lbs of seed</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black">{result.bags7}</div>
                        <div className="text-xs text-green-300">bags (7 lb)</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300">
                    {st.label} — {st.rate} lbs per 1,000 sq ft · {sun.label}
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


      {/* ── Supporting content ── */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              The pounds you need depend on the grass, not just the area
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              This calculator works from 5 lb per 1,000 sq ft for a new lawn, which is a sensible middle for
              the sun-and-shade mixes most bags contain. Sow a single species and that number can be badly
              wrong in either direction. Published seeding rates run roughly:
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li><span className="font-semibold text-slate-700">Kentucky bluegrass</span> — 2 to 3 lb per 1,000 sq ft</li>
              <li><span className="font-semibold text-slate-700">Fine fescue</span> — 4 to 5 lb</li>
              <li><span className="font-semibold text-slate-700">Perennial ryegrass</span> — 6 to 9 lb</li>
              <li><span className="font-semibold text-slate-700">Tall fescue</span> — 6 to 10 lb</li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              The spread is seed size, not quality. A pound of Kentucky bluegrass holds roughly two million
              seeds; a pound of tall fescue closer to 230,000. You need about eight times the weight of tall
              fescue to put the same number of seeds on the ground. Check the rate printed on the bag against
              what this page gives you — if you are buying a pure tall fescue, expect to need more.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Timing decides more than the rate does
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              For cool-season grasses — bluegrass, the fescues, ryegrass — late summer into early autumn is
              the window worth waiting for. Soil is still warm enough to germinate quickly, air temperature
              is falling rather than climbing, and the annual weeds are finishing their year instead of
              starting it. A seeding that would struggle in June often establishes without drama in
              September.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Spring is the second-best option and a harder one. Crabgrass germinates in the same conditions
              your seed does, and the pre-emergent that would normally stop it will stop your grass seed
              too — so a spring seeding means going into summer with weed pressure and a root system that
              has not had time to go deep.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Warm-season grasses run on the opposite schedule. Bermuda and zoysia go down in late spring or
              early summer, once soil temperatures are reliably warm, and seeding them in autumn wastes the
              bag.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Watering is where most new lawns are lost
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Before germination the job is to keep the top quarter inch of soil damp — not wet, and never
              dry. In warm weather that usually means two or three short waterings a day rather than one
              long one. The common mistake is a single deep soak, which washes seed into low spots, leaves
              bare patches where it came from, and lets the surface dry out for twenty hours in between.
              Seed that has taken up water and then dries out does not recover.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Once the grass is up, reverse it: fewer waterings, each one longer, so the moisture goes deeper
              and the roots follow it down. And expect the lawn to come up in waves. Perennial ryegrass shows
              in about 5 to 10 days, tall fescue 7 to 12, fine fescue 7 to 14, and Kentucky bluegrass
              anywhere from 14 to 30. Most bagged mixes contain ryegrass precisely so something green appears
              while the slow half is still working — which is also why a seeding that looks like a failure on
              day ten often is not.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Starter fertilizer, and the phosphorus rule
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Starter formulas carry proportionally more phosphorus — the middle number on the bag — because
              phosphorus supports root development in seedlings. Standard lawn fertilizer is the wrong
              product here: its nitrogen drives top growth that a seedling has no root system to support, and
              at high rates it will burn new grass outright.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              One practical catch. Several US states restrict the sale or application of phosphorus lawn
              fertilizer, generally with an exemption for establishing new turf or where a soil test shows a
              deficiency. New seeding is usually the case the exemption was written for, but the rule and the
              paperwork vary by state, so check yours before ordering rather than after.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              Seed needed by lawn size
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Using this page&apos;s rates — 5 lb per 1,000 sq ft for a new lawn, 3 for overseeding — and the
              common 7 lb bag. Every figure is this page&apos;s own formula applied to the stated area.
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span>Lawn area</span>
                <span className="flex gap-6">
                  <span className="w-28 text-right">New lawn</span>
                  <span className="w-28 text-right">Overseeding</span>
                </span>
              </div>
              {SEED_EXAMPLES.map(([area, fresh, over], i) => (
                <div
                  key={area}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                >
                  <span className="text-slate-600">{area}</span>
                  <span className="flex gap-6">
                    <span className="w-28 text-right font-bold text-slate-800">{fresh}</span>
                    <span className="w-28 text-right text-slate-600">{over}</span>
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
              . Seeding rates, germination windows and watering guidance follow published agronomic
              practice; the rate on your seed bag is specific to that blend and takes precedence over any
              general figure here. Product recommendations are researched and compared against manufacturer
              specifications and verified buyer feedback — we do not grow test plots.
            </p>
          </section>
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
