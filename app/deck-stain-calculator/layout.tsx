import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deck Stain Calculator",
  description:
    "Calculate how many gallons of deck stain you need including railings and stairs — the part most people under-buy — plus cleaner and brighteners.",
  alternates: { canonical: "/deck-stain-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
