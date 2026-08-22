import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here — same split as every other calculator.
export const metadata: Metadata = {
  title: "Roof Calculator: Squares, Bundles & Materials",
  description:
    "Work out roof area, squares, and shingle bundles from your footprint and pitch, plus underlayment, drip edge, and ridge cap. Includes a roof pitch multiplier table.",
  alternates: { canonical: "https://www.buildguiders.com/roof-calculator" },
  openGraph: {
    title: "Roof Calculator: Squares, Bundles & Materials | BuildGuiders",
    description:
      "Work out roof area, squares, and shingle bundles from your footprint and pitch, plus underlayment, drip edge, and ridge cap. Includes a roof pitch multiplier table.",
    url: "https://www.buildguiders.com/roof-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
