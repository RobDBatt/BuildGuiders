// components/HeroFull.tsx
import Image from "next/image";

export default function HeroFull() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-2xl
                      h-[38vh] md:h-[46vh] lg:h-[52vh] max-h-[580px]">
        {/* Full-bleed, optimized image */}
        <Image
          src="/hero.jpg"                // export 1920×1080 from Canva
          alt="BuildGuiders - Smart picks. Simple guides."
          fill
          priority
          sizes="(min-width:1024px) 1024px, 100vw"
          className="object-cover object-center"
        />
        {/* Subtle gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
      </div>

      {/* Keep an H1 for SEO, but visually hide it */}
      <h1 className="sr-only">BuildGuiders - Smart picks. Simple guides.</h1>
    </section>
  );
}
