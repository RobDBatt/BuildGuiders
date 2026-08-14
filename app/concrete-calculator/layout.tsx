import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concrete Calculator",
  description:
    "Calculate concrete for a slab, footing or post holes — bags or cubic yards — plus the mixing tools and rebar to buy with it.",
  alternates: { canonical: "/concrete-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
