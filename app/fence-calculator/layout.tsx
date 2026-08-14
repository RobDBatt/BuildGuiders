import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fence Calculator",
  description:
    "Calculate posts, panels, rails and concrete for any fence run, plus post caps and gate hardware. Works for wood, vinyl and chain link.",
  alternates: { canonical: "/fence-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
