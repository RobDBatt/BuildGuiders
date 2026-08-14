import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paint Calculator",
  description:
    "Work out how many gallons of paint and primer a room needs, then get the rollers, brushes, tape and drop cloths on one shopping list.",
  alternates: { canonical: "/paint-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
