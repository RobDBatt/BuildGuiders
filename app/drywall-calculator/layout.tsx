import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drywall Calculator",
  description:
    "Calculate how many sheets of drywall a room needs, plus joint compound, tape, screws and corner bead for the full mudding kit.",
  alternates: { canonical: "/drywall-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
