import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raised Garden Bed Soil Calculator",
  description:
    "Calculate exactly how many bags of soil, compost, and amendments you need to fill a raised garden bed. Supports multiple beds and any depth.",
  alternates: { canonical: "/raised-garden-bed-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
