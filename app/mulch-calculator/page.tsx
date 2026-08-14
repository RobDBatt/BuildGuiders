"use client";
import { useState, useMemo } from "react";
import { AMAZON_TAG } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

const GREEN = "#1B4332";
const aUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;

const CUBIC_FEET_PER_YARD = 27;
const RECOMMENDED_DEPTH = 3; // inches — standard for a new bed
const BULK_BREAK_EVEN_YARDS = 3;

// ── Materials ─────────────────────────────────────────────────────────────────
// bagOptions are the sizes actually stocked for each material. Mulch is sold in
// both 2 and 3 cu ft bags; gravel and play sand come in one standard 0.5 cu ft
// (50 lb) bag, so their toggle collapses to a single option.
const MATERIALS = [
  { id: "mulch", label: "Mulch", bagOptions: [2, 3] },
  { id: "topsoil", label: "Topsoil", bagOptions: [0.75, 1.5] },
  { id: "compost", label: "Compost", bagOptions: [1, 1.5] },
  { id: "gravel", label: "Gravel / Stone", bagOptions: [0.5] },
  { id: "sand", label: "Play Sand / Paver Sand", bagOptions: [0.5] },
];

const DEPTHS = [1, 2, 3, 4, 6]; // inches

// ── Bed shapes ────────────────────────────────────────────────────────────────
type ShapeField = "length" | "width" | "diameter" | "base" | "height";

const BED_SHAPES: { id: string; label: string; fields: { key: ShapeField; label: string }[] }[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    fields: [
      { key: "length", label: "Length (ft)" },
      { key: "width", label: "Width (ft)" },
    ],
  },
  {
    id: "circle",
    label: "Circle",
    fields: [{ key: "diameter", label: "Diameter (ft)" }],
  },
  {
    id: "triangle",
    label: "Triangle",
    fields: [
      { key: "base", label: "Base (ft)" },
      { key: "height", label: "Height (ft)" },
    ],
  },
  {
    id: "irregular",
    label: "Irregular",
    fields: [
      { key: "length", label: "Longest point (ft)" },
      { key: "width", label: "Widest point (ft)" },
    ],
  },
];

interface Bed {
  id: string;
  shape: string;
  length: string;
  width: string;
  diameter: string;
  base: string;
  height: string;
}

// Deterministic first render — no crypto.randomUUID() during SSR, so the
// server and client agree on the initial markup.
const INITIAL_BEDS: Bed[] = [
  { id: "bed-1", shape: "rectangle", length: "10", width: "10", diameter: "", base: "", height: "" },
];

function bedArea(b: Bed): number {
  const n = (v: string) => parseFloat(v) || 0;
  if (b.shape === "rectangle") return n(b.length) * n(b.width);
  if (b.shape === "circle") return Math.PI * (n(b.diameter) / 2) ** 2;
  if (b.shape === "triangle") return (n(b.base) * n(b.height)) / 2;
  // Freeform beds: the bounding box overstates, and ~80% of it lands close for
  // the usual curved-edge bed. Splitting into rectangles is more accurate.
  if (b.shape === "irregular") return n(b.length) * n(b.width) * 0.8;
  return 0;
}

function calc(beds: Bed[], depthIn: number, matId: string, bagCuFt: number) {
  const mat = MATERIALS.find((m) => m.id === matId)!;
  const totalSqFt = beds.reduce((sum, b) => sum + bedArea(b), 0);
  const depthFt = depthIn / 12;
  const totalCuFt = totalSqFt * depthFt;
  const cubicYards = totalCuFt / CUBIC_FEET_PER_YARD;

  return {
    mat,
    bagCuFt,
    totalSqFt: Math.round(totalSqFt),
    totalCuFt: Math.round(totalCuFt * 10) / 10,
    cubicYards: Math.round(cubicYards * 100) / 100,
    bags: Math.ceil(totalCuFt / bagCuFt),
    // Coverage figures the user can sanity-check in the aisle.
    sqFtPerBag: Math.round((bagCuFt / depthFt) * 10) / 10,
    sqFtPerYard: Math.round(CUBIC_FEET_PER_YARD / depthFt),
    bagsPerYard: Math.round((CUBIC_FEET_PER_YARD / bagCuFt) * 10) / 10,
    fabricRolls: Math.max(1, Math.ceil(totalSqFt / 150)), // 150 sq ft per roll
    bulkIsCheaper: cubicYards >= BULK_BREAK_EVEN_YARDS,
  };
}

type Result = ReturnType<typeof calc>;

// ── Reference table ───────────────────────────────────────────────────────────
// This page's own math at the recommended 3-inch depth, 2 cu ft bags.
const COVERAGE_EXAMPLES: [string, string, string][] = [
  ["50 sq ft", "7 bags", "0.46 yd"],
  ["100 sq ft", "13 bags", "0.93 yd"],
  ["200 sq ft", "25 bags", "1.85 yd"],
  ["300 sq ft", "38 bags", "2.78 yd"],
  ["500 sq ft", "63 bags", "4.63 yd"],
  ["1,000 sq ft", "125 bags", "9.26 yd"],
];

// ── UI pieces ─────────────────────────────────────────────────────────────────
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all"
      style={
        active
          ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN }
          : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }
      }
    >
      {children}
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300"
        onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${GREEN}`)}
        onBlur={(e) => (e.target.style.boxShadow = "none")}
        style={{ outline: "none" }}
      />
    </div>
  );
}

// ── Shopping list ─────────────────────────────────────────────────────────────
interface ShoppingItem {
  qty: number;
  name: string;
  note: string;
  tip?: string;
  /** Omitted for bulk delivery, which is a local supplier order. */
  amazon?: string;
}

function buildShoppingList(result: Result, delivery: boolean): ShoppingItem[] {
  const { mat, bags, cubicYards, bagCuFt, sqFtPerBag, fabricRolls } = result;

  const primary = delivery
    ? {
        qty: Math.max(1, Math.ceil(cubicYards)),
        name: `${mat.label} — Bulk Delivery (cubic yards)`,
        note: `${cubicYards} cubic yards, ordered as ${Math.max(1, Math.ceil(cubicYards))} — suppliers sell by the whole yard. That is about ${bags} bags' worth.`,
        tip: `Tip: One cubic yard covers about ${result.sqFtPerYard} sq ft at this depth. Order from a local landscape supplier or garden center — have somewhere for the pile to be dumped and a wheelbarrow ready before it arrives.`,
      }
    : {
        qty: bags,
        name: `${mat.label} Bags (${bagCuFt} cu ft each)`,
        note: `${bags} bags at ${bagCuFt} cu ft — each one covers about ${sqFtPerBag} sq ft at this depth`,
        tip: result.bulkIsCheaper
          ? `Tip: At ${cubicYards} cubic yards you are past the point where bulk delivery usually costs less. Switch the toggle to compare.`
          : "Tip: Buy one bag over the count above. Beds are never quite the rectangle you measured.",
        amazon: aUrl("B07BFYQZ1W"),
      };

  return [
    primary,
    {
      qty: fabricRolls,
      name: "Landscape Fabric (4 ft × 50 ft roll)",
      note: `${fabricRolls} roll${fabricRolls > 1 ? "s" : ""} — blocks weeds under mulch or gravel`,
      tip: "Tip: Fabric earns its keep under gravel and stone. Under mulch it is optional — mulch is meant to break down into the soil, and fabric gets in the way of that.",
      amazon: aUrl("B000IEPFAS"),
    },
    {
      qty: 1,
      name: "Landscape Staples (50 pack)",
      note: "Pins fabric to the ground so it does not shift while you spread",
      amazon: aUrl("B07N5VXPLD"),
    },
    {
      qty: 1,
      name: "Landscape Edging (20 ft coil)",
      note: "Keeps mulch in the bed instead of on the lawn after the first heavy rain",
      tip: "Tip: Aluminum edging outlasts plastic and stays put without stakes working loose over a winter.",
      amazon: aUrl("B00002N80N"),
    },
    {
      qty: 1,
      name: "Garden Gloves (pair)",
      note: "Mulch and topsoil bags shred bare hands",
      amazon: aUrl("B00V2DTPDI"),
    },
    {
      qty: 1,
      name: "Bow Rake",
      note: "Spread and level the mulch evenly — you will use it the whole job",
      amazon: aUrl("B000H5RMAC"),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MulchCalculator() {
  const [beds, setBeds] = useState<Bed[]>(INITIAL_BEDS);
  const [nextBedId, setNextBedId] = useState(2);
  const [depth, setDepth] = useState(RECOMMENDED_DEPTH);
  const [matId, setMatId] = useState("mulch");
  const [bagCuFt, setBagCuFt] = useState(2);
  const [delivery, setDelivery] = useState(false);
  const [copied, setCopied] = useState(false);

  const material = MATERIALS.find((m) => m.id === matId)!;
  const result = useMemo(() => calc(beds, depth, matId, bagCuFt), [beds, depth, matId, bagCuFt]);
  const shoppingList = useMemo(() => buildShoppingList(result, delivery), [result, delivery]);

  function selectMaterial(id: string) {
    setMatId(id);
    // Bag sizes are material-specific — fall back to that material's standard.
    const next = MATERIALS.find((m) => m.id === id)!;
    if (!next.bagOptions.includes(bagCuFt)) setBagCuFt(next.bagOptions[0]);
  }

  function updateBed(id: string, field: keyof Bed, value: string) {
    setBeds((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  function addBed() {
    setBeds((prev) => [
      ...prev,
      { id: `bed-${nextBedId}`, shape: "rectangle", length: "", width: "", diameter: "", base: "", height: "" },
    ]);
    setNextBedId((n) => n + 1);
  }

  function handleCopyList() {
    const lines = [
      `🌿 ${material.label} Shopping List — BuildGuiders.com`,
      `Area: ${result.totalSqFt.toLocaleString()} sq ft at ${depth}" deep`,
      `Volume: ${result.totalCuFt} cu ft · ${result.cubicYards} cubic yards · ${result.bags} bags`,
      "",
      ...shoppingList.map((i) => `☐ ${i.qty} — ${i.name}. ${i.note}`),
      "",
      "Generated at buildguiders.com/mulch-calculator",
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
          <a
            href="/guides/best-mulch-for-flower-beds"
            style={{ color: "#86efac", fontSize: 13, fontWeight: 600, textDecoration: "none", marginLeft: 16 }}
          >
            Buying Guide
          </a>
        </div>
        <div style={{ height: 4, background: "linear-gradient(90deg,#D97706,#F59E0B,#D97706)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🌿</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Mulch Calculator</h1>
              <p className="text-slate-500 mt-1">
                Cubic yards and the exact bag count for any bed shape and depth. Also handles topsoil, compost, gravel,
                and paver sand.
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
            Mulch needed = bed square footage × depth in feet. At the standard 3-inch depth that is × 0.25, so a
            100 sq ft bed takes 25 cubic feet — about{" "}
            <strong className="text-slate-800">0.9 cubic yards, or 13 bags</strong> of the common 2-cubic-foot size. One
            2 cu ft bag covers roughly 8 sq ft at 3 inches deep; one cubic yard covers about 108 sq ft. The calculator
            below does it for rectangular, circular, triangular, and irregular beds, and gives you the rest of the
            shopping list with it.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Material">
              <div className="p-4 space-y-2">
                {MATERIALS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMaterial(m.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={
                      matId === m.id
                        ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN }
                        : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Depth">
              <div className="p-4 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {DEPTHS.map((n) => (
                    <Pill key={n} active={depth === n} onClick={() => setDepth(n)}>
                      {n}
                      {"″"}
                      {n === RECOMMENDED_DEPTH && (
                        <span className="block text-[9px] font-bold uppercase tracking-wide opacity-80">Recommended</span>
                      )}
                    </Pill>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-snug">
                  3{"″"} is standard for a new mulch bed. 2{"″"} for a top-up over mulch still in good shape,
                  4{"″"} on bare soil with heavy weed pressure. 1{"″"} for paver sand, 6{"″"} for filling
                  a new raised bed.
                </p>
              </div>
            </Card>

            {material.bagOptions.length > 1 && (
              <Card title="Bag Size">
                <div className="p-4 space-y-2">
                  <div className="flex gap-2">
                    {material.bagOptions.map((size) => (
                      <Pill key={size} active={bagCuFt === size} onClick={() => setBagCuFt(size)}>
                        {size} cu ft
                      </Pill>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Check the bag before you fill the cart — the count changes with the size.
                  </p>
                </div>
              </Card>
            )}

            <Card title="Bags or Bulk">
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <Pill active={!delivery} onClick={() => setDelivery(false)}>
                    Bags (store pickup)
                  </Pill>
                  <Pill active={delivery} onClick={() => setDelivery(true)}>
                    Bulk Delivery
                  </Pill>
                </div>
                <p className="text-xs text-slate-400">
                  Bulk is usually the cheaper option past about {BULK_BREAK_EVEN_YARDS} cubic yards, once the delivery
                  fee spreads across enough material.
                </p>
              </div>
            </Card>

            <div className="space-y-3">
              {beds.map((b, i) => {
                const shape = BED_SHAPES.find((s) => s.id === b.shape)!;
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="font-bold text-slate-700 text-sm">
                        Bed / Area {beds.length > 1 ? i + 1 : ""}
                        <span className="block text-xs font-medium text-slate-400">
                          {Math.round(bedArea(b))} sq ft
                        </span>
                      </h2>
                      {beds.length > 1 && (
                        <button
                          onClick={() => setBeds((prev) => prev.filter((x) => x.id !== b.id))}
                          className="text-xs text-red-400 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {BED_SHAPES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateBed(b.id, "shape", s.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
                            style={
                              b.shape === s.id
                                ? { backgroundColor: GREEN, color: "#fff", borderColor: GREEN }
                                : { backgroundColor: "#fff", color: "#475569", borderColor: "#e2e8f0" }
                            }
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {shape.fields.map((f) => (
                          <NumberField
                            key={f.key}
                            label={f.label}
                            value={b[f.key]}
                            onChange={(v) => updateBed(b.id, f.key, v)}
                          />
                        ))}
                      </div>
                      {b.shape === "irregular" && (
                        <p className="text-xs text-slate-400 leading-snug">
                          Curved beds are estimated at 80% of the box they fit inside. Split the bed into rectangles for
                          a tighter number.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={addBed}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GREEN;
                  e.currentTarget.style.color = GREEN;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                + Add another bed
              </button>
            </div>
          </div>

          {/* ── RIGHT: Results (always rendered — no click gate) ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="text-white rounded-2xl p-5" style={{ backgroundColor: GREEN }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm font-medium text-green-200 uppercase tracking-wider">Total area</div>
                  <div className="text-3xl font-black">
                    {result.totalSqFt.toLocaleString()} <span className="text-xl font-semibold text-green-200">sq ft</span>
                  </div>
                </div>
                <div className="flex gap-5 text-center">
                  <div>
                    <div className="text-3xl font-black">{result.cubicYards}</div>
                    <div className="text-xs text-green-300">cubic yards</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black">{result.bags}</div>
                    <div className="text-xs text-green-300">bags ({result.bagCuFt} cu ft)</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-700 text-xs text-green-300 leading-relaxed">
                {result.totalCuFt} cubic feet at {depth}
                {"″"} deep · one {result.bagCuFt} cu ft bag covers about {result.sqFtPerBag} sq ft at this depth ·
                one cubic yard covers about {result.sqFtPerYard} sq ft ({result.bagsPerYard} bags to a yard)
              </div>
            </div>

            {result.bulkIsCheaper && !delivery && (
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-4 flex gap-3">
                <span className="text-blue-500 text-lg">💡</span>
                <div>
                  <div className="font-bold text-blue-900 text-sm">
                    {result.bags} bags is past the point where bulk usually costs less
                  </div>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    You are at {result.cubicYards} cubic yards. Bulk is priced by the yard with a flat delivery fee, so
                    it tends to win once the material volume is large enough to absorb that fee. It also saves opening
                    and hauling {result.bags} bags by hand — but you need somewhere for the pile to land and a
                    wheelbarrow to move it.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-800">Your Shopping List</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {result.totalSqFt.toLocaleString()} sq ft · {depth}
                    {"″"} deep · {delivery ? "bulk delivery" : `${result.bags} bags`}
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
                  BuildGuiders earns a commission on qualifying purchases at no extra cost to you. It never changes what
                  the calculator returns or which products are listed. Full details on our{" "}
                  <a href="/about" className="underline" style={{ color: GREEN }}>
                    methodology page
                  </a>
                  .
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {shoppingList.map((item) => (
                  <div key={item.name} className="px-5 py-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-800">
                        {item.qty}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.note}</p>
                        {item.tip && <p className="text-xs text-amber-600 mt-1 leading-snug">{item.tip}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-11">
                      {item.amazon ? (
                        <a
                          href={item.amazon}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-white text-xs font-bold rounded-lg"
                          style={{ backgroundColor: "#FF9900" }}
                        >
                          Amazon
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Order from a local landscape supplier</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How we calculated */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-700 text-sm mb-2">📐 How we calculated this</h3>
              <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                <p>
                  • Area: {beds.length} bed{beds.length !== 1 ? "s" : ""} totalling{" "}
                  {result.totalSqFt.toLocaleString()} sq ft
                </p>
                <p>
                  • Volume: {result.totalSqFt.toLocaleString()} sq ft × {depth}
                  {"″"} ÷ 12 = {result.totalCuFt} cubic feet
                </p>
                <p>
                  • Cubic yards: {result.totalCuFt} ÷ 27 = {result.cubicYards} yd³
                </p>
                <p>
                  • Bags: {result.totalCuFt} ÷ {result.bagCuFt} cu ft per bag = {result.bags} bags, rounded up
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supporting content ── */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">How much mulch do I need?</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Two numbers decide it: the square footage of the bed and how deep you want the mulch. Multiply them and
              you have the volume — the only trick is that depth is measured in inches while everything else is in feet,
              so the depth has to be divided by 12 first.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              At the standard 3-inch depth that works out to 0.25 ft, so a 100 sq ft bed needs 25 cubic feet of mulch.
              Divide by 27 to get cubic yards (0.93) or by the bag size to get a bag count — 13 bags at 2 cubic feet
              each, or 9 at 3 cubic feet.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Round up, always. Beds are never quite the clean rectangle you measured, mulch settles as you rake it out,
              and running one bag short at the end of a row is a second trip for a single bag. One extra bag is the
              cheapest insurance on the whole job.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">How deep should mulch be?</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Three inches is the working default for a new bed. That is deep enough to keep light off weed seeds and
              slow evaporation from the soil, and shallow enough that rain and air still get through to the roots.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc pl-5 mb-3">
              <li>
                <strong className="text-slate-700">2 inches</strong> — topping up a bed where the existing mulch is
                still in decent shape. Measure what is already there first; the goal is a total of about 3 inches, not
                3 inches of new material on top of 3 inches of old.
              </li>
              <li>
                <strong className="text-slate-700">3 inches</strong> — a new bed, or one being stripped and redone.
              </li>
              <li>
                <strong className="text-slate-700">4 inches</strong> — bare soil with heavy weed pressure, where the
                extra depth is doing real work.
              </li>
              <li>
                <strong className="text-slate-700">1 inch</strong> — paver sand, which is a levelling bed rather than a
                mulch layer.
              </li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              Deeper is not better past 4 inches. A thick layer can shed water before it reaches the root zone, hold
              damp against stems, and give fungal growth somewhere to sit. The same logic applies around trees: keep the
              mulch pulled back from the trunk flare instead of piling it against the bark.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">Bags or bulk — where the line sits</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Bagged mulch is priced per bag and you carry it home. Bulk is priced per cubic yard and carries a flat
              delivery fee, which means the fee spreads thinner the more you order. Somewhere around 3 cubic yards is
              where bulk typically starts coming out ahead — and 3 cubic yards is about 41 two-cubic-foot bags to lift,
              haul, open, and flatten.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Volume is not the only factor. Bulk needs a driveway or a tarped patch the truck can dump on, a
              wheelbarrow, and ideally a free weekend, because the pile is your problem the moment it lands. Bags can go
              in the garage and wait. If the job is under a couple of yards, or you are doing it in stages, bags usually
              win on convenience even where bulk wins on price.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              Measuring an irregular or curved bed
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Almost no real bed is a rectangle, which is why square-footage estimates run high — people measure the
              longest and widest points and multiply, which gives them the box the bed sits inside rather than the bed
              itself.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              The quick fix is to take that bounding box and use about 80 percent of it. For a typical curved
              foundation bed or an island bed with rounded ends, that lands close. The Irregular shape option above does
              exactly this, so you can measure the two easy numbers and move on.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              When you want a tighter figure, break the bed into pieces you can measure cleanly and add them up. A long
              curved border is usually a rectangle with a half-circle at each end. An island bed is often two triangles
              back to back. Add each piece as its own entry above and the calculator totals them — that is what the
              multiple-bed feature is for, and it works just as well on one bed split into three shapes as it does on
              three separate beds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              Mulch needed by bed size, at 3 inches deep
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Bag counts assume the standard 2-cubic-foot bag. Every figure is this page&apos;s own formula applied to
              the stated area.
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span>Bed area</span>
                <span className="flex gap-8">
                  <span className="w-20 text-right">Bags</span>
                  <span className="w-20 text-right">Bulk</span>
                </span>
              </div>
              {COVERAGE_EXAMPLES.map(([area, bags, yards], i) => (
                <div
                  key={area}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                >
                  <span className="text-slate-600">{area}</span>
                  <span className="flex gap-8">
                    <span className="w-20 text-right font-bold text-slate-800">{bags}</span>
                    <span className="w-20 text-right text-slate-600">{yards}</span>
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

          <section>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3">Next steps</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Not sure which mulch to buy? Our guide to the{" "}
              <a href="/guides/best-mulch-for-flower-beds" className="font-semibold underline" style={{ color: GREEN }}>
                best mulch for flower beds
              </a>{" "}
              compares shredded hardwood, cedar, pine bark and dyed options on how long they hold color and how well
              they knit together. Filling a raised bed rather than topping a border? The{" "}
              <a href="/raised-garden-bed-calculator" className="font-semibold underline" style={{ color: GREEN }}>
                raised garden bed soil calculator
              </a>{" "}
              sizes soil, compost and perlite instead.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Written and maintained by the{" "}
              <a href="/about" className="font-semibold underline" style={{ color: GREEN }}>
                BuildGuiders team
              </a>
              . Volumes use standard landscaping geometry (27 cubic feet per cubic yard) and the bag sizes stocked by
              major retailers. Product recommendations are researched and compared against manufacturer specifications
              and verified buyer feedback — we do not lab-test mulch.
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
