import type { Metadata } from "next";
import Script from "next/script";
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
    logo: "https://www.buildguiders.com/images/covers/Cover-Deck.png",
  };

  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildGuiders",
    url: "https://www.buildguiders.com",
  };

  // Skimlinks auto-affiliate layer. When NEXT_PUBLIC_SKIMLINKS_ID is set,
  // Skimlinks rewrites outbound merchant links (Home Depot, Lowe's, tools,
  // decking, etc.) into affiliate links at runtime. It does NOT touch Amazon
  // links, so the existing tag=buildguiders-20 links are unaffected. Left
  // inert (nothing rendered) until the env var is configured in Vercel.
  // To use Sovrn instead, swap the src below for the Sovrn/VigLink snippet.
  const skimlinksId = process.env.NEXT_PUBLIC_SKIMLINKS_ID;

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
        {skimlinksId && (
          <Script
            src={`https://s.skimresources.com/js/${skimlinksId}.skimlinks.js`}
            strategy="lazyOnload"
          />
        )}
        {children}
      </body>
    </html>
  );
}
