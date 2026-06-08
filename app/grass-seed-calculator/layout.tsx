import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grass Seed Calculator",
  description:
    "Calculate exactly how many pounds of grass seed you need for a new lawn, overseeding, or bare patch repair — plus starter fertilizer and supply list.",
  alternates: { canonical: "/grass-seed-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
