import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Flooring Calculator: Boxes, Underlay & Trim",
  description:
    "Boxes of flooring, underlayment, and trim for your room, with the waste factor already built in. Enter dimensions, get an exact list.",
  alternates: { canonical: "https://www.buildguiders.com/flooring-calculator" },
  openGraph: {
    title: "Flooring Calculator: Boxes, Underlay & Trim | BuildGuiders",
    description:
      "Boxes of flooring, underlayment, and trim for your room, with the waste factor already built in. Enter dimensions, get an exact list.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/flooring-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
