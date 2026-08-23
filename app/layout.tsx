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
    "Free material calculators for home projects. Enter your dimensions, get an exact shopping list — every item, every quantity, every link. One trip, not four.",
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
    // Was /images/covers/Cover-Deck.png, which 404s — no file in public/.
    logo: "https://www.buildguiders.com/og-default.png",
  };

  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildGuiders",
    url: "https://www.buildguiders.com",
  };

  // No Skimlinks and no Impact UTT here on purpose — both applications were
  // denied in Jul 2026 (see the affiliate-layer section of AGENTS.md). Neither
  // script earned anything; they only loaded a third-party request on every
  // page, and the Impact tag ran beforeInteractive, which blocks rendering.
  //
  // If either is ever approved, restore it gated on its env var with NO
  // hardcoded fallback ID, so an un-set variable means the tag stays off:
  //   const skimlinksId = process.env.NEXT_PUBLIC_SKIMLINKS_ID;
  // Amazon links carry tag=buildguiders-20 directly and are unaffected either
  // way.

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

        {/* Ahrefs Web Analytics (privacy-friendly, cookieless). Key is the
            public data-key for the BuildGuiders Ahrefs project. */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="PsTS/JyosXsLfnN2TD10kg"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
