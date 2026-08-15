import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Fence Calculator: Posts, Rails & Pickets",
  description:
    "Posts, rails, pickets, and concrete for your fence line. Enter length and height, get the full material list before you head to the store.",
  alternates: { canonical: "https://www.buildguiders.com/fence-calculator" },
  openGraph: {
    title: "Fence Calculator: Posts, Rails & Pickets | BuildGuiders",
    description:
      "Posts, rails, pickets, and concrete for your fence line. Enter length and height, get the full material list before you head to the store.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/fence-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
