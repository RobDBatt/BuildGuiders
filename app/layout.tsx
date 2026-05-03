import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BuildGuiders — Free Home Project Material Calculators",
    template: "%s | BuildGuiders",
  },
  description:
    "Free material calculators for home projects. Enter your dimensions, get an exact shopping list — every item, every quantity, every link. Make one trip, not four.",
  keywords: [
    "home project calculator",
    "material calculator",
    "paint calculator",
    "flooring calculator",
    "deck calculator",
    "drywall calculator",
    "home improvement calculator",
    "how much paint do I need",
    "how many deck boards do I need",
  ],
  metadataBase: new URL("https://buildguiders.com"),
  openGraph: {
    type: "website",
    siteName: "BuildGuiders",
    title: "BuildGuiders — Free Home Project Material Calculators",
    description:
      "Enter your dimensions, get an exact shopping list. Every item, every quantity, every link — before you leave the house.",
    url: "https://buildguiders.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildGuiders — Free Home Project Material Calculators",
    description:
      "Enter your dimensions, get an exact shopping list. Make one trip, not four.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
