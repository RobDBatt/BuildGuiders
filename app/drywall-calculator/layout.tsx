import type { Metadata } from "next";
import { FAQS } from "./faqs";

// The calculator page itself is a client component and cannot export metadata,
// so it lives here. Without it every calculator inherited the site-default
// title and emitted no canonical — 13 pages competing on one duplicate title.
export const metadata: Metadata = {
  title: "Drywall Calculator: Sheets, Mud & Screws",
  description:
    "Sheets, joint compound, tape, and screws for your room dimensions — with the taping tools, so nothing stalls the job halfway through.",
  alternates: { canonical: "https://www.buildguiders.com/drywall-calculator" },
  openGraph: {
    title: "Drywall Calculator: Sheets, Mud & Screws | BuildGuiders",
    description:
      "Sheets, joint compound, tape, and screws for your room dimensions — with the taping tools, so nothing stalls the job halfway through.",
    // Must match the canonical: the inherited og:url pointed every calculator
    // at the homepage.
    url: "https://www.buildguiders.com/drywall-calculator",
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
