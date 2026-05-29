import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import GaListener from "./ga-listener";

const BASE_URL = "https://www.buildguiders.com";

export const metadata: Metadata = {
  title: {
    default: "BuildGuiders - HVAC Troubleshooting & Buying Guides",
    template: "%s | BuildGuiders",
  },
  description:
    "Fix mini-split error codes, choose the right smart thermostat, and solve HVAC problems with step-by-step guides for MRCOOL, Mitsubishi, Ecobee, Navien, and more.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BuildGuiders",
    title: "BuildGuiders - HVAC Troubleshooting & Buying Guides",
    description:
      "Fix mini-split error codes, choose the right smart thermostat, and solve HVAC problems with step-by-step guides.",
    url: BASE_URL,
    images: [
      {
        url: "/images/bg/bg-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "BuildGuiders - HVAC Troubleshooting & Buying Guides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildGuiders - HVAC Troubleshooting & Buying Guides",
    description:
      "Fix mini-split error codes, choose the right smart thermostat, and solve HVAC problems with step-by-step guides.",
    images: ["/images/bg/bg-og-1200x630.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const siteClass = 'site-build';

  return (
    <html lang="en" className="h-full">
      <head>
        <meta
          name="google-site-verification"
          content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ""}
        />
      </head>
      <body className={`${siteClass} h-full bg-[#0a0a0a] text-white antialiased`}>
        <Suspense fallback={null}>
          <GaListener />
        </Suspense>
        <SiteHeader />
        <div className="min-h-[calc(100vh-80px)]">
          {children}
        </div>
        <SiteFooter />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
