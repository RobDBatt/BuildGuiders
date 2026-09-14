import type { Metadata } from "next";
import { FAQS } from "./faqs";

export const metadata: Metadata = {
  title: "Grass Seed Calculator: How Much Do I Need?",
  description:
    "Calculate exactly how many pounds of grass seed you need for a new lawn, overseeding, or bare patch repair — plus starter fertilizer and supply list.",
  alternates: { canonical: "/grass-seed-calculator" },
  // Without this the page inherited the layout's openGraph, whose og:url points
  // at the homepage — an og:url/canonical mismatch on every page that had a
  // canonical but no openGraph of its own.
  openGraph: {
    title: "Grass Seed Calculator | BuildGuiders",
    description:
      "How many pounds of grass seed you need for a new lawn, overseeding, or bare patch repair — plus starter fertilizer and supplies.",
    url: "https://www.buildguiders.com/grass-seed-calculator",
    type: "website",
    siteName: "BuildGuiders",
    images: [{ url: "https://www.buildguiders.com/og-default.png", width: 1200, height: 630 }],
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
