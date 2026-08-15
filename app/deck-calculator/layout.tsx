import type { Metadata } from "next";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Deck Calculator: Boards, Joists & Posts",
  description:
    "Boards, beam, joists, posts, stairs, and spindles — the complete material list for a code-compliant deck, from your own dimensions.",
  alternates: { canonical: "https://www.buildguiders.com/deck-calculator" },
  openGraph: {
    title: "Deck Calculator: Boards, Joists & Posts | BuildGuiders",
    description:
      "Boards, beam, joists, posts, stairs, and spindles — the complete material list for a code-compliant deck, from your own dimensions.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/deck-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
