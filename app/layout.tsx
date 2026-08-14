import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BuildGuiders — Free Home Project Material Calculators",
    template: "%s | BuildGuiders",
  },
  description:
    "Free material calculators for home projects. Enter your dimensions, get an exact shopping list — every item, every quantity, every link.",
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
  metadataBase: new URL("https://www.buildguiders.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "BuildGuiders",
    title: "BuildGuiders — Free Home Project Material Calculators",
    description:
      "Enter your dimensions, get an exact shopping list. Every item, every quantity, every link — before you leave the house.",
    url: "https://www.buildguiders.com",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "BuildGuiders — flat-lay of home project materials in cream, green, and amber",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildGuiders — Free Home Project Material Calculators",
    description:
      "Enter your dimensions, get an exact shopping list. Make one trip, not four.",
    images: ["/og-default.png"],
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
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildGuiders",
    url: "https://www.buildguiders.com",
    // public/images/ is not in the repo — point at an asset that actually ships.
    logo: "https://www.buildguiders.com/og-default.png",
  };

  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildGuiders",
    url: "https://www.buildguiders.com",
  };

  // Affiliate layer: Amazon Associates only.
  //
  // Skimlinks was removed in Jul 2026 — permanent, do not re-add.
  // The Impact.com UTT was removed after the Jul 2026 application was denied.
  // Impact can be reapplied for around Oct 2026; if it is approved, the UTT
  // goes back in as a `beforeInteractive` script (it both verifies domain
  // ownership and runs transformLinks for partnered advertisers like Home
  // Depot) and /privacy needs a matching disclosure added at the same time.
  // Until then, neither network's script belongs in this layout: they load on
  // every page, cost real render time, and track nothing.

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-5LZDVK9T95" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5LZDVK9T95');
          `}
        </Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
