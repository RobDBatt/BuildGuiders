"use client";
import Image from "next/image";

export default function HeroFull() {
  const src = "/hero.jpg";
  return (
    <section className="gg-container">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
        <Image
          src={src}
          alt="BuildGuiders hero"
          width={1920}
          height={900}
          className="w-full h-[360px] sm:h-[420px] lg:h-[480px] object-cover"
          priority
        />
      </div>
    </section>
  );
}
