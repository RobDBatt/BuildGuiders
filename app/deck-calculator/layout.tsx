import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deck Calculator",
  description:
    "Calculate decking boards, joists, posts and concrete for any deck size, plus every piece of hardware — joist hangers, screws and flashing.",
  alternates: { canonical: "/deck-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
