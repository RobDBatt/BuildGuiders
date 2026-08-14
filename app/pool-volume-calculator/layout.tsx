import type { Metadata } from "next";
import { BASE_URL } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

export const metadata: Metadata = {
  title: "Pool Volume Calculator",
  description:
    "Calculate how many gallons your pool holds — rectangle, round, oval, or kidney, with a sloped floor or a constant depth. Includes liters, cubic feet, turnover flow rate, and a maintenance shopping list.",
  alternates: { canonical: "/pool-volume-calculator" },
  openGraph: {
    title: "Pool Volume Calculator — How Many Gallons Is My Pool?",
    description:
      "Enter your pool's shape and depth, get gallons, liters, cubic feet, the pump flow rate for an 8-hour turnover, and the maintenance supplies to buy.",
    url: `${BASE_URL}/pool-volume-calculator`,
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
