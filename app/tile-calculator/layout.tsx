import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tile Calculator",
  description:
    "Calculate how many tiles you need for a floor or wall, with grout line spacing and a waste factor, plus thinset, grout and the tools to set them.",
  alternates: { canonical: "/tile-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
