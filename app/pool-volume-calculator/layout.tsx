import type { Metadata } from "next";
import { BASE_URL } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

export const metadata: Metadata = {
  title: "Pool Volume Calculator",
  description:
    "Calculate how many gallons your pool holds — rectangle, round, oval or kidney, sloped floor or constant depth. Plus liters, cubic feet and pump turnover rate.",
  alternates: { canonical: "/pool-volume-calculator" },
  openGraph: {
    title: "Pool Volume Calculator — How Many Gallons Is My Pool?",
    description:
      "Enter your pool's shape and depth, get gallons, liters, cubic feet, the pump flow rate for an 8-hour turnover, and the maintenance supplies to buy.",
    url: `${BASE_URL}/pool-volume-calculator`,
    type: "website",
    siteName: "BuildGuiders",
    // A page-level openGraph replaces the root layout's wholesale, so the
    // image has to be restated or shares of this page render with no card.
    images: [{ url: `${BASE_URL}/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // FAQPage structured data. Answers are the same strings the page renders —
  // both import FAQS — so the markup never drifts from the visible copy.
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
