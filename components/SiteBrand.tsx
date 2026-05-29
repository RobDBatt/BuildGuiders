"use client";
import Link from "next/link";

export default function SiteBrand() {
  return (
    <Link href="/" className="block select-none no-underline">
      <div className="leading-none">
        <span
          className="
            inline-block
            text-3xl sm:text-4xl md:text-5xl lg:text-6xl
            font-extrabold tracking-tight
            text-transparent bg-clip-text
            bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400
            drop-shadow-[0_8px_30px_rgba(0,0,0,0.25)]
            [text-shadow:0_1px_0_rgba(255,255,255,0.25)]
          ">
          Gadget<span className="opacity-90">Guiders</span>
        </span>
        <span className="block text-[11px] sm:text-xs md:text-sm font-medium text-neutral-400 tracking-[0.28em] uppercase mt-1">
          Brand-first solutions
        </span>
      </div>
    </Link>
  );
}
