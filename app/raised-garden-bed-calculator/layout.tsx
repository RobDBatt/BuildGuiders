import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raised Garden Bed Soil Calculator",
  description:
    "Calculate exactly how many bags of soil, compost, and amendments you need to fill a raised garden bed. Supports multiple beds and any depth.",
  alternates: { canonical: "/raised-garden-bed-calculator" },
  // Without this the page inherited the layout's openGraph, whose og:url points
  // at the homepage — an og:url/canonical mismatch on every page that had a
  // canonical but no openGraph of its own.
  openGraph: {
    title: "Raised Garden Bed Soil Calculator | BuildGuiders",
    description:
      "How many bags of soil, compost, and amendments you need to fill a raised garden bed. Supports multiple beds and any depth.",
    url: "https://www.buildguiders.com/raised-garden-bed-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
