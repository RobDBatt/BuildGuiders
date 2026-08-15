import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Tile Calculator: Boxes, Thinset & Grout",
  description:
    "Boxes of tile, thinset, grout, and spacers for your floor or wall, waste factor included. Enter your dimensions for an exact list.",
  alternates: { canonical: "https://www.buildguiders.com/tile-calculator" },
  openGraph: {
    title: "Tile Calculator: Boxes, Thinset & Grout | BuildGuiders",
    description:
      "Boxes of tile, thinset, grout, and spacers for your floor or wall, waste factor included. Enter your dimensions for an exact list.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/tile-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
