import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Drywall Calculator: Sheets, Mud & Screws",
  description:
    "Sheets, joint compound, tape, and screws for your room dimensions — with the taping tools, so nothing stalls the job halfway through.",
  alternates: { canonical: "https://www.buildguiders.com/drywall-calculator" },
  openGraph: {
    title: "Drywall Calculator: Sheets, Mud & Screws | BuildGuiders",
    description:
      "Sheets, joint compound, tape, and screws for your room dimensions — with the taping tools, so nothing stalls the job halfway through.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/drywall-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
