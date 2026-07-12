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

  // Skimlinks auto-affiliate layer. Skimlinks rewrites outbound merchant links
  // (Home Depot, Lowe's, tools, decking, etc.) into affiliate links at runtime.
  // It does NOT touch Amazon links, so the existing tag=buildguiders-20 links
  // are unaffected. The publisher ID is public (it ships in the client-side
  // script, like the GA ID above); set NEXT_PUBLIC_SKIMLINKS_ID to override it.
  // To use Sovrn instead, swap the src below for the Sovrn/VigLink snippet.
  const skimlinksId = process.env.NEXT_PUBLIC_SKIMLINKS_ID || "306091X1794326";

  // Impact.com Universal Tracking Tag (UTT). Two jobs: it verifies domain
  // ownership (Impact detects the tag firing on buildguiders.com), and its
  // transformLinks call rewrites outbound links to Impact-partnered advertisers
  // (e.g. Home Depot, once the partnership is approved) into tracked affiliate
  // links at runtime. It does NOT touch Amazon links (tag=buildguiders-20 is
  // unaffected), and Skimlinks stays the catch-all for everything Impact
  // doesn't cover. The UTT URL is public (it ships in the client-side script);
  // set NEXT_PUBLIC_IMPACT_UTT_SRC to override it.
  const impactUttSrc =
    process.env.NEXT_PUBLIC_IMPACT_UTT_SRC ||
    "https://utt.impactcdn.com/P-A7270311-aa48-4ba2-996f-0033f3364b3c1.js";

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
        {impactUttSrc && (
          <Script id="impact-utt" strategy="beforeInteractive">
            {`(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('${impactUttSrc}','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
