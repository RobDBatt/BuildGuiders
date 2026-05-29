"use client";

import { buildAmazonUrl, getProductById } from "@/lib/productCatalog";

type GgProductProps = {
  id: string;
  title?: string;
};

export default function GgProduct(props: GgProductProps) {
  const { id, title } = props;
  const product = getProductById(id);
  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG;

  const heading = title ?? "Buy once";
  const fallbackLabel = product?.label ?? "Recommended accessory";
  const fallbackNotes =
    product?.notes ?? "Affiliate link unavailable for this item.";

  const renderFallback = () => (
    <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-100">
      <h3 className="text-base font-semibold text-neutral-50">{heading}</h3>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-neutral-50">{fallbackLabel}</p>
          {fallbackNotes && <p className="text-neutral-300">{fallbackNotes}</p>}
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        As an Amazon Associate, BuildGuiders earns from qualifying purchases.
      </p>
    </section>
  );

  if (!product) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("GgProduct: unknown product id", { id, props });
    }
    return renderFallback();
  }

  const href = buildAmazonUrl(product.asin, amazonTag);
  if (!href) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("GgProduct: buildAmazonUrl returned empty URL", {
        id,
        asin: product.asin,
      });
    }
    return renderFallback();
  }

  return (
    <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-100">
      <h3 className="text-base font-semibold text-neutral-50">{heading}</h3>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-neutral-50">{product.label}</p>
          {product.notes && (
            <p className="text-neutral-300">{product.notes}</p>
          )}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="self-start rounded-md border border-sky-600 px-3 py-2 text-sm font-semibold text-sky-200 hover:border-sky-400 hover:text-sky-100"
        >
          View on Amazon (paid link)
        </a>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        As an Amazon Associate, BuildGuiders earns from qualifying purchases.
      </p>
    </section>
  );
}
