import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Paint Calculator: How Much Paint Do I Need?",
  description:
    "Enter your room dimensions and get an exact paint shopping list — gallons, primer, rollers, and tape. One trip to the store, not four.",
  alternates: { canonical: "https://www.buildguiders.com/paint-calculator" },
  openGraph: {
    title: "Paint Calculator: How Much Paint Do I Need? | BuildGuiders",
    description:
      "Enter your room dimensions and get an exact paint shopping list — gallons, primer, rollers, and tape. One trip to the store, not four.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/paint-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
