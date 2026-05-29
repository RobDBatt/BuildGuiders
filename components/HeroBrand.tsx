import Image from "next/image";
import Link from "next/link";

export default function HeroBrand() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-2xl
                      bg-neutral-950/75 h-[260px] md:h-[320px]">
        {/* SVG hero artwork (portrait) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/hero/hero.svg?v=20251102011921"
            alt="BuildGuiders - Simple Guides. Smart Picks."
            width={800}
            height={450}
            className="h-[75%] md:h-[82%] w-auto"
          />
        </div>
        <h1 className="sr-only">BuildGuiders - Simple Guides. Smart Picks.</h1>
        <div className="absolute bottom-6 left-1/2 -tranneutral-x-1/2">
          <Link
            href="/articles"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow hover:bg-neutral-100"
          >
            Browse articles
          </Link>
        </div>
      </div>
    </section>
  );
}
