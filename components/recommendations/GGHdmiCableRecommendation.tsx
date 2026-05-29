"use client";

import { getProductById, buildAmazonUrl } from "@/lib/productCatalog";

const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG;

const CABLE_IDS = [
  "hdmi_21_short_6ft",
  "hdmi_21_medium_10ft",
  "hdmi_21_fiber_long",
];

export default function GGHdmiCableRecommendation() {
  const products = CABLE_IDS.map((id) => getProductById(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );

  if (products.length === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-neutral-700 bg-neutral-900/70 p-4 text-sm text-neutral-100">
      <h3 className="text-base font-semibold text-neutral-50">
        HDMI cables we recommend for this setup
      </h3>
      <p className="mt-1 text-neutral-300">
        Use certified Ultra High Speed HDMI cables for 4K HDR, 120 Hz, and
        stable ARC/eARC.
      </p>
      <ul className="mt-3 space-y-1">
        {products.map((p) => (
          <li key={p.id}>
            <a
              href={buildAmazonUrl(p.asin, amazonTag)}
              className="underline text-emerald-300 hover:text-emerald-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.label} (paid link)
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-400">
        As an Amazon Associate, BuildGuiders earns from qualifying
        purchases.
      </p>
    </section>
  );
}
