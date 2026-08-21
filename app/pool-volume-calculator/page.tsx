"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

const GREEN = "#1B4332";
const aUrl = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

const GALLONS_PER_CUBIC_FOOT = 7.48;
const LITERS_PER_GALLON = 3.785411784;
const TURNOVER_HOURS = 8; // standard residential target

// ── Shapes ───────────────────────────────────────────────────────────────────
// Oval and kidney use the industry shape constants (0.893 and 0.45) rather than
// true ellipse geometry — they account for the way real pools are built.
type FieldKey = "length" | "width" | "diameter" | "widthA" | "widthB";

const SHAPES: {
  id: string;
  label: string;
  sub: string;
  fields: { key: FieldKey; label: string; hint?: string }[];
}[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    sub: "Straight sides — most ingrounds",
    fields: [
      { key: "length", label: "Length (ft)" },
      { key: "width", label: "Width (ft)" },
    ],
  },
  {
    id: "round",
    label: "Round",
    sub: "Circular above-ground",
    fields: [{ key: "diameter", label: "Diameter (ft)", hint: "Measure the water, not the outside of the top rail" }],
  },
  {
    id: "oval",
    label: "Oval",
    sub: "Longer than wide, rounded ends",
    fields: [
      { key: "length", label: "Long side (ft)" },
      { key: "width", label: "Short side (ft)" },
    ],
  },
  {
    id: "kidney",
    label: "Kidney / Freeform",
    sub: "Curved, two different widths",
    fields: [
      { key: "widthA", label: "Width A (ft)", hint: "Widest point" },
      { key: "widthB", label: "Width B (ft)", hint: "Narrowest point" },
      { key: "length", label: "Length (ft)", hint: "Longest run, end to end" },
    ],
  },
];

// ── Maintenance sizing bands ──────────────────────────────────────────────────
// Chemical concentration varies by product, so the list is sized by volume band
// rather than dosed by the gallon. Every quantity here is "what to buy for a
// pool this size" — actual dosing comes off the product label and a test kit.
const VOLUME_BANDS = [
  {
    max: 5_000,
    label: "Under 5,000 gallons",
    sub: "Small above-ground, plunge pool, or spa",
    tabsPerWeek: "1 tab",
    shockBags: "1 bag",
    algaecide: 1,
  },
  {
    max: 15_000,
    label: "5,000 – 15,000 gallons",
    sub: "Most round and oval above-ground pools",
    tabsPerWeek: "1–3 tabs",
    shockBags: "1–2 bags",
    algaecide: 1,
  },
  {
    max: 25_000,
    label: "15,000 – 25,000 gallons",
    sub: "Standard residential inground",
    tabsPerWeek: "3–5 tabs",
    shockBags: "2–3 bags",
    algaecide: 1,
  },
  {
    max: Infinity,
    label: "Over 25,000 gallons",
    sub: "Large inground",
    tabsPerWeek: "5–7 tabs",
    shockBags: "3–4 bags",
    algaecide: 2,
  },
];

// ── Calculation engine ────────────────────────────────────────────────────────
function calcPool({
  shapeId,
  length,
  width,
  diameter,
  widthA,
  widthB,
  sloped,
  depth,
  shallow,
  deep,
}: {
  shapeId: string;
  length: number;
  width: number;
  diameter: number;
  widthA: number;
  widthB: number;
  sloped: boolean;
  depth: number;
  shallow: number;
  deep: number;
}) {
  const avgDepth = sloped ? (shallow + deep) / 2 : depth;
  if (!(avgDepth > 0)) return null;

  let areaSqFt = 0;
  if (shapeId === "rectangle") areaSqFt = length * width;
  else if (shapeId === "round") areaSqFt = Math.PI * (diameter / 2) ** 2;
  else if (shapeId === "oval") areaSqFt = length * width * 0.893;
  else if (shapeId === "kidney") areaSqFt = (widthA + widthB) * length * 0.45;
  if (!(areaSqFt > 0)) return null;

  const cubicFeet = areaSqFt * avgDepth;
  const gallons = cubicFeet * GALLONS_PER_CUBIC_FOOT;
  const liters = gallons * LITERS_PER_GALLON;
  const band = VOLUME_BANDS.find((b) => gallons < b.max) ?? VOLUME_BANDS[VOLUME_BANDS.length - 1];

  return {
    avgDepth: Math.round(avgDepth * 100) / 100,
    areaSqFt: Math.round(areaSqFt),
    cubicFeet: Math.round(cubicFeet),
    gallons: Math.round(gallons),
    liters: Math.round(liters),
    // Minimum pump flow to turn the whole pool over once in 8 hours.
    turnoverGpm: Math.ceil(gallons / (TURNOVER_HOURS * 60)),
    band,
  };
}

type Result = NonNullable<ReturnType<typeof calcPool>>;

// ── Shopping list ─────────────────────────────────────────────────────────────
function buildShoppingList(result: Result) {
  const { band } = result;
  return [
    {
      qty: 1,
      name: "Pool Test Kit or Test Strips",
      note: "Start here — every chemical below is dosed off a test reading, not off gallons alone",
      tip: "Tip: Test strips are fine for weekly checks. A drop-based kit reads chlorine and pH more precisely when something is off.",
      amazon: aUrl("swimming pool test kit chlorine ph"),
    },
    {
      qty: 1,
      name: "3-Inch Stabilized Chlorine Tabs (bucket)",
      note: `About ${band.tabsPerWeek} per week at ${band.label.toLowerCase()}`,
      tip: "Tip: Tabs go in a floater or an inline feeder — never straight into the skimmer, where they sit against the pump seals and corrode them.",
      amazon: aUrl("3 inch stabilized chlorine tablets pool"),
    },
    {
      qty: 1,
      name: "Floating Chlorine Dispenser",
      note: "Holds the tabs and meters them out slowly instead of dumping all at once",
      amazon: aUrl("floating chlorine tablet dispenser pool"),
    },
    {
      qty: 1,
      name: "Pool Shock (single-dose bags)",
      note: `Roughly ${band.shockBags} per shock treatment at this volume — buy a multi-pack to cover the season`,
      tip: "Tip: Shock after dark. Sunlight burns off unstabilized chlorine before it finishes working.",
      amazon: aUrl("pool shock bags multi pack"),
    },
    {
      qty: band.algaecide,
      name: "Algaecide",
      note:
        band.algaecide > 1
          ? "Two bottles — a pool this size runs through a season's dosing faster than one bottle covers"
          : "One bottle covers a typical season at this volume",
      amazon: aUrl("swimming pool algaecide"),
    },
    {
      qty: 1,
      name: "Pool Brush + Telescoping Pole",
      note: "Brushing the walls and floor is what keeps algaecide and chlorine from having to do all the work",
      amazon: aUrl("pool brush telescoping pole"),
    },
  ];
}

// ── UI pieces ─────────────────────────────────────────────────────────────────
function Item({
  qty,
  name,
  note,
  tip,
  amazon,
}: {
  qty: number;
  name: string;
  note: string;
  tip?: string;
  amazon: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-800 leading-none">
          <span>{qty}</span>
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm">{name}</div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{note}</p>
          {tip && <p className="text-xs text-amber-600 mt-1 leading-snug">{tip}</p>}
        </div>
      </div>
      <div className="flex gap-2 ml-11">
        <a
          href={amazon}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-white text-xs font-bold rounded-lg"
          style={{ backgroundColor: "#FF9900" }}
        >
          Amazon
        </a>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
        onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${GREEN}`)}
        onBlur={(e) => (e.target.style.boxShadow = "none")}
        style={{ outline: "none" }}
      />
      {hint && <p className="text-xs text-slate-400 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

// ── Reference tables ──────────────────────────────────────────────────────────
// Every figure below is this page's own formula applied to the stated dimensions,
// rounded to the nearest hundred gallons.
const ROUND_EXAMPLES: [string, string][] = [
  ["12 ft round", "3,400"],
  ["15 ft round", "5,300"],
  ["18 ft round", "7,600"],
  ["21 ft round", "10,400"],
  ["24 ft round", "13,500"],
  ["27 ft round", "17,100"],
  ["30 ft round", "21,100"],
];

const RECT_EXAMPLES: [string, string][] = [
  ["12 × 24 ft", "11,800"],
  ["14 × 28 ft", "16,100"],
  ["16 × 32 ft", "21,100"],
  ["18 × 36 ft", "26,700"],
  ["20 × 40 ft", "32,900"],
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PoolVolumeCalculator() {
  // Seeded with the most common residential inground size (16 × 32 ft sloping
  // 3 ft to 8 ft, ~21,100 gallons) so the volume and the shopping list render
  // server-side. A crawler never clicks a Calculate button.
  const [shapeId, setShapeId] = useState("rectangle");
  const [length, setLength] = useState("32");
  const [width, setWidth] = useState("16");
  const [diameter, setDiameter] = useState("");
  const [widthA, setWidthA] = useState("");
  const [widthB, setWidthB] = useState("");
  const [sloped, setSloped] = useState(true);
  const [depth, setDepth] = useState("");
  const [shallow, setShallow] = useState("3");
  const [deep, setDeep] = useState("8");
  const [copied, setCopied] = useState(false);

  const shape = SHAPES.find((s) => s.id === shapeId)!;

  const setters: Record<FieldKey, (v: string) => void> = {
    length: setLength,
    width: setWidth,
    diameter: setDiameter,
    widthA: setWidthA,
    widthB: setWidthB,
  };
  const values: Record<FieldKey, string> = { length, width, diameter, widthA, widthB };

  const result = useMemo(
    () =>
      calcPool({
        shapeId,
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        diameter: parseFloat(diameter) || 0,
        widthA: parseFloat(widthA) || 0,
        widthB: parseFloat(widthB) || 0,
        sloped,
        depth: parseFloat(depth) || 0,
        shallow: parseFloat(shallow) || 0,
        deep: parseFloat(deep) || 0,
      }),
    [shapeId, length, width, diameter, widthA, widthB, sloped, depth, shallow, deep]
  );

  const shoppingList = useMemo(() => (result ? buildShoppingList(result) : []), [result]);

  function handleCopyList() {
    if (!result) return;
    const lines = [
      "🏊 Pool Maintenance Shopping List — BuildGuiders.com",
      `Pool volume: ${result.gallons.toLocaleString()} gallons (${result.liters.toLocaleString()} liters)`,
      `Average depth: ${result.avgDepth} ft · Surface area: ${result.areaSqFt.toLocaleString()} sq ft`,
      "",
      ...shoppingList.map((i) => `☐ ${i.qty} — ${i.name}. ${i.note}`),
      "",
      "Dose every chemical to its label and to your test readings, not to gallons alone.",
      "Generated at buildguiders.com/pool-volume-calculator",
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <style>{`@keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>

      <header style={{ background: GREEN }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#fff", textDecoration: "none" }}>
            Build<span style={{ color: "#86efac" }}>Guiders</span>
          </a>
          <a href="/#calculators" style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            ← All Calculators
          </a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🏊</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Pool Volume Calculator</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
                  Pool &amp; Water
                </span>
              </div>
              <p className="text-slate-500">
                How many gallons your pool actually holds — sloped floors included, plus the supplies to keep it clear.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer-first summary */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="rounded-xl border-2 border-slate-200 bg-white px-5 py-4">
          <div className="font-bold text-slate-800 text-sm mb-1.5">The short answer</div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pool volume in gallons = surface area × average depth × 7.48. Average depth on a pool that slopes is the
            shallow-end water depth plus the deep-end water depth, divided by two. A 16 × 32 ft rectangular pool running
            3 ft to 8 ft holds about <strong className="text-slate-800">21,100 gallons</strong>; a 24 ft round
            above-ground pool filled to 4 ft holds about <strong className="text-slate-800">13,500 gallons</strong>. The
            calculator below does it for rectangle, round, oval, and kidney shapes, and sizes a maintenance list to match.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Pool Shape">
              <div className="p-4 space-y-2">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShapeId(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={
                      shapeId === s.id
                        ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN }
                        : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }
                    }
                  >
                    {s.label} <span className="text-xs opacity-70 block">{s.sub}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Dimensions">
              <div className="p-4 space-y-3">
                {shape.fields.map((f) => (
                  <NumberField
                    key={f.key}
                    label={f.label}
                    hint={f.hint}
                    value={values[f.key]}
                    onChange={setters[f.key]}
                  />
                ))}
              </div>
            </Card>

            <Card title="Depth">
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  {[
                    [true, "Slopes to a deep end"],
                    [false, "Same depth throughout"],
                  ].map(([val, label]) => (
                    <button
                      key={String(val)}
                      onClick={() => setSloped(val as boolean)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                      style={
                        sloped === val
                          ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN }
                          : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }
                      }
                    >
                      {label as string}
                    </button>
                  ))}
                </div>

                {sloped ? (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Shallow end (ft)" value={shallow} onChange={setShallow} />
                    <NumberField label="Deep end (ft)" value={deep} onChange={setDeep} />
                  </div>
                ) : (
                  <NumberField label="Water depth (ft)" value={depth} onChange={setDepth} />
                )}

                <p className="text-xs text-slate-400 leading-snug">
                  Measure the water, not the wall. An above-ground pool with a 52-inch wall usually holds about 46–48
                  inches of water — that is 3.8 to 4 ft, not 4.3 ft.
                </p>
              </div>
            </Card>

          </div>

          {/* ── RIGHT: Results ── */}
          <div className="lg:col-span-3 space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-4xl mb-4">🏊</div>
                <h3 className="font-bold text-slate-700 text-lg">Enter your pool&apos;s dimensions</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">
                  Pick a shape and fill in the measurements. Use your real water depth — the shallow and deep readings,
                  not the wall height.
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
                  <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Pool volume</div>
                  <div className="text-4xl sm:text-5xl font-black leading-tight">
                    {result.gallons.toLocaleString()} <span className="text-2xl font-semibold text-green-200">gallons</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-green-300">
                    <div>
                      <div className="font-bold text-green-100 text-sm">{result.liters.toLocaleString()}</div>
                      <div>liters</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-100 text-sm">{result.cubicFeet.toLocaleString()}</div>
                      <div>cubic feet</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-100 text-sm">{result.areaSqFt.toLocaleString()}</div>
                      <div>sq ft surface</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-100 text-sm">{result.avgDepth} ft</div>
                      <div>average depth</div>
                    </div>
                  </div>
                </div>

                {/* Turnover */}
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-4 flex gap-3">
                  <span className="text-blue-500 text-lg">💧</span>
                  <div>
                    <div className="font-bold text-blue-900 text-sm">
                      Your pump needs about {result.turnoverGpm} GPM for an 8-hour turnover
                    </div>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      {result.gallons.toLocaleString()} gallons ÷ 480 minutes = {result.turnoverGpm} gallons per minute
                      to circulate the whole pool once in 8 hours, the usual residential target. Your filter&apos;s rated
                      flow should meet or exceed that, and pipe diameter caps what the system can really move — a pump
                      rated above what the plumbing passes just burns electricity.
                    </p>
                  </div>
                </div>

                {/* Sloped-floor caveat */}
                {sloped && (
                  <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4 flex gap-3">
                    <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                    <div>
                      <div className="font-bold text-amber-900 text-sm">This assumes a constant slope</div>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Averaging the shallow and deep readings is exact when the floor drops at a steady grade. If your
                        pool has a flat shallow shelf that breaks into a sharp hopper, this figure runs high — the shelf
                        covers more floor area than the hopper does. Measure a third depth at the midpoint and average
                        all three, or run the shallow half and the deep half through the calculator separately and add
                        the results.
                      </p>
                    </div>
                  </div>
                )}

                {/* Shopping List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black text-slate-800">Your Shopping List</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {result.band.label} · {result.band.sub}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyList}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 flex-shrink-0"
                      style={{ borderColor: GREEN, color: GREEN }}
                    >
                      {copied ? "✓ Copied!" : "Copy list"}
                    </button>
                  </div>

                  {/* Affiliate disclosure — above the links, per site policy */}
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs text-slate-500 leading-snug">
                      <strong className="text-slate-600">Disclosure:</strong> the links below are Amazon affiliate links.
                      BuildGuiders earns a commission on qualifying purchases at no extra cost to you. It never changes
                      what the calculator returns or which products are listed. Full details on our{" "}
                      <a href="/about" className="underline" style={{ color: GREEN }}>
                        methodology page
                      </a>
                      .
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {shoppingList.map((item) => (
                      <Item key={item.name} {...item} />
                    ))}
                  </div>

                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1.5">Read before you dose</p>
                    <div className="space-y-1">
                      {[
                        "Quantities above are what to buy for a pool this size — they are not doses. Chemical concentration varies by product and brand.",
                        "Dose to the product label and to what your test kit reads. Water temperature, sunlight, rainfall, and how many people swim all move the number.",
                        "Balance pH and total alkalinity before chlorinating. Chlorine loses much of its effect above roughly pH 7.8.",
                        "Never mix chemicals in the same container, and add chemicals to water — never water to chemicals.",
                      ].map((line) => (
                        <p key={line} className="text-xs text-amber-700 flex gap-1.5">
                          <span className="flex-shrink-0">•</span>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* How we calculated */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
                  <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                    {shapeId === "rectangle" && <p>• Surface area: {length} × {width} = {result.areaSqFt.toLocaleString()} sq ft</p>}
                    {shapeId === "round" && <p>• Surface area: π × ({diameter} ÷ 2)² = {result.areaSqFt.toLocaleString()} sq ft</p>}
                    {shapeId === "oval" && <p>• Surface area: {length} × {width} × 0.893 (oval shape factor) = {result.areaSqFt.toLocaleString()} sq ft</p>}
                    {shapeId === "kidney" && <p>• Surface area: ({widthA} + {widthB}) × {length} × 0.45 (kidney shape factor) = {result.areaSqFt.toLocaleString()} sq ft</p>}
                    <p>
                      • Average depth:{" "}
                      {sloped ? `(${shallow} + ${deep}) ÷ 2 = ${result.avgDepth} ft` : `${result.avgDepth} ft, constant`}
                    </p>
                    <p>
                      • Volume: {result.areaSqFt.toLocaleString()} sq ft × {result.avgDepth} ft ={" "}
                      {result.cubicFeet.toLocaleString()} cubic feet
                    </p>
                    <p>
                      • Gallons: {result.cubicFeet.toLocaleString()} cubic feet × 7.48 gallons per cubic foot ={" "}
                      {result.gallons.toLocaleString()} gallons
                    </p>
                    <p>
                      • Liters: {result.gallons.toLocaleString()} × 3.785 = {result.liters.toLocaleString()} liters
                    </p>
                    <p>
                      • Turnover flow: {result.gallons.toLocaleString()} ÷ (8 hours × 60 minutes) = {result.turnoverGpm} GPM
                    </p>
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
              How to measure a pool that slopes to a deep end
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              This is where most pool volume estimates go wrong. People measure the deep end, plug that in, and end up
              with a number 30 to 40 percent too high — then over-buy chemicals all season on the strength of it.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              A pool that slopes has one depth that matters for volume: the average. Measure the water depth at the
              shallow end, measure it again at the deepest point, add them, divide by two. Averaging that way is exact
              when the floor drops at a constant grade from one end to the other, which covers most vinyl-liner pools
              and most simple slope designs.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              It stops being exact on a hopper-bottom pool — the shape with a long flat shallow shelf, a steep
              transition, then a flat deep bottom under the diving end. There the shallow shelf covers far more floor
              area than the deep hopper does, so a straight two-point average weights the deep end more than the pool
              actually does and the total comes out high. Two ways to handle it:
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li>
                Take a third reading at the midpoint of the slope and average all three. Quick, and close enough for
                sizing chemicals and a pump.
              </li>
              <li>
                Split the pool into a shallow section and a deep section, run each through the calculator as its own
                rectangle with its own average depth, and add the two results. More work, more accurate.
              </li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              One more thing worth checking: measure to the water line, not to the coping or the top of the wall. Pools
              run several inches below their structural height, and that gap comes straight off your volume.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Why an above-ground pool holds less than the box says
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              A 24 ft round pool sold as a &ldquo;24 × 52&rdquo; has a 52-inch wall. It does not hold 52 inches of
              water. Manufacturers direct you to fill to roughly the middle of the skimmer opening, which leaves about 4
              to 6 inches of dry wall above the surface — so actual water depth lands closer to 46 to 48 inches.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Volume scales directly with depth, so losing 4 inches off a 52-inch wall takes roughly 8 percent of the
              water with it, and losing 6 inches takes about 12 percent. On a 24 ft round that is the difference between
              about 14,700 gallons at full wall height and about 13,500 gallons at a realistic 4 ft fill. Order
              chemicals against the box number and you are dosing a pool that does not exist.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              The stated diameter is worth a second look too. It is often measured across the outside of the top rail,
              while the water sits inside the wall — a few inches narrower. It is a smaller error than the depth one,
              but it runs in the same direction. Measure your own water and use that.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              What turnover rate means, and the pump it implies
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Turnover rate is the time it takes the pump to push a volume of water equal to the whole pool through the
              filter. Eight hours is the standard residential target; public pools are typically held to shorter
              turnovers under health codes.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              The math is one division. Take the pool volume in gallons and divide by the turnover time in minutes. For
              an 8-hour turnover that is 480 minutes, so a 20,000-gallon pool needs about 42 gallons per minute and a
              13,500-gallon above-ground needs about 28 GPM.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Two things to know before you shop on that number. The filter has its own rated flow, and it should meet
              or exceed the pump&apos;s — a pump that outruns its filter pushes water through too fast to clean it
              properly. And plumbing diameter puts a hard ceiling on flow no matter what the pump is rated for, so an
              oversized pump on undersized pipe mostly converts electricity into noise. Sizing to the turnover figure,
              rather than above it, is usually the right call.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Common pool sizes, in gallons</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Every figure below is this page&apos;s formula applied to the stated dimensions, rounded to the nearest
              hundred gallons. Use them as a sanity check on your own measurement, not as a substitute for it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-700 text-sm mb-2">Round above-ground, 4 ft of water</h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {ROUND_EXAMPLES.map(([size, gal], i) => (
                    <div
                      key={size}
                      className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                    >
                      <span className="text-slate-600">{size}</span>
                      <span className="font-bold text-slate-800">{gal} gal</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm mb-2">Rectangular inground, 3 ft to 8 ft</h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {RECT_EXAMPLES.map(([size, gal], i) => (
                    <div
                      key={size}
                      className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                    >
                      <span className="text-slate-600">{size}</span>
                      <span className="font-bold text-slate-800">{gal} gal</span>
                    </div>
                  ))}
                </div>
              </div>
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
              . Volumes come from standard pool-industry geometry (7.48 gallons per cubic foot; 0.893 and 0.45 shape
              factors for oval and kidney pools). Product recommendations are researched and compared against
              manufacturer specifications and verified buyer feedback — we do not lab-test pool chemicals, and nothing
              here is a dosing instruction. Follow the label on the product you buy and your own test readings.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 BuildGuiders.com · Free home project calculators</p>
          <p className="text-xs text-slate-300 max-w-sm text-right">
            Earns from qualifying purchases via Amazon Associates and affiliate programs. Never affects our calculations.
          </p>
        </div>
      </footer>
    </div>
  );
}
