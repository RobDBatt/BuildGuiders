import type { Metadata } from "next";
import { BASE_URL } from "@/lib/site-config.generated";
import { FAQS } from "./faqs";

export const metadata: Metadata = {
  title: "Mulch Calculator — Bags & Cubic Yards",
  description:
    "Calculate how much mulch you need — cubic yards and the exact bag count. Enter your bed size and depth, get a full shopping list with fabric, edging and tools.",
  alternates: { canonical: "/mulch-calculator" },
  openGraph: {
    title: "Mulch Calculator — How Much Mulch Do I Need?",
    description:
      "Cubic yards and the exact bag count for any bed shape and depth, plus the landscape fabric, edging and tools to buy with it.",
    url: `${BASE_URL}/mulch-calculator`,
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
