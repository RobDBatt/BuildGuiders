import Link from "next/link";

const brands = [
  { label: "Apple", slug: "apple" },
  { label: "LG", slug: "lg" },
  { label: "Sony", slug: "sony" },
  { label: "Denon", slug: "denon" },
  { label: "Samsung", slug: "samsung" },
];

export default function BrandChips() {
  return (
    <div className="mx-auto max-w-6xl px-4 mt-4 flex flex-wrap gap-3">
      {brands.map((b) => (
        <Link
          key={b.slug}
          href={`/brands/${b.slug}`}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10 transition"
        >
          {b.label}
        </Link>
      ))}
    </div>
  );
}
