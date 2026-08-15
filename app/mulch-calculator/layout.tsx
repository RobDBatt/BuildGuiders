import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Mulch Calculator: Bags & Cubic Yards",
  description:
    "Bags or cubic yards of mulch and topsoil for your beds, at the depth you choose, plus the tools to spread it. Enter your bed dimensions.",
  alternates: { canonical: "https://www.buildguiders.com/mulch-calculator" },
  openGraph: {
    title: "Mulch Calculator: Bags & Cubic Yards | BuildGuiders",
    description:
      "Bags or cubic yards of mulch and topsoil for your beds, at the depth you choose, plus the tools to spread it. Enter your bed dimensions.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/mulch-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
