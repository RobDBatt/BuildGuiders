import Image from "next/image";

export default function HeroFlatlay() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="relative h-[420px] overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-2xl">
        <Image
          src="/images/flatlay.jpg"
          alt=""
          priority
          fill
          className="object-cover"
          style={{ objectPosition: "50% 35%" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950/20 via-transparent to-neutral-950/40" />
      </div>
    </div>
  );
}
