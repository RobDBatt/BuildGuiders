import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Deck Stain Calculator: How Much Stain?",
  description:
    "Enter your deck size and get the gallons of stain or sealer it needs, plus brushes, pads, and cleaner. Sized for one coat or two.",
  alternates: { canonical: "https://www.buildguiders.com/deck-stain-calculator" },
  openGraph: {
    title: "Deck Stain Calculator: How Much Stain? | BuildGuiders",
    description:
      "Enter your deck size and get the gallons of stain or sealer it needs, plus brushes, pads, and cleaner. Sized for one coat or two.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/deck-stain-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
