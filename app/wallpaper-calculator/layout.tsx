import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallpaper Calculator",
  description:
    "Calculate how many rolls of wallpaper you need for any room. Works for peel-and-stick, pre-pasted, and traditional wallpaper — pattern repeat waste included.",
  alternates: { canonical: "/wallpaper-calculator" },
  // Without this the page inherited the layout's openGraph, whose og:url points
  // at the homepage — an og:url/canonical mismatch on every page that had a
  // canonical but no openGraph of its own.
  openGraph: {
    title: "Wallpaper Calculator | BuildGuiders",
    description:
      "How many rolls of wallpaper you need for any room. Works for peel-and-stick, pre-pasted, and traditional wallpaper, repeat waste included.",
    url: "https://www.buildguiders.com/wallpaper-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
