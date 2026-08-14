import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flooring Calculator",
  description:
    "Calculate boxes of flooring for any room, waste factor included, plus underlayment and transition strips. Works for LVP, laminate and hardwood.",
  alternates: { canonical: "/flooring-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
