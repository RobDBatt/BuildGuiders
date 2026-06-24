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
      <body>
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
      </body>
    </html>
  );
}
