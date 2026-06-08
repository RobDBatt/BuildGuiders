import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallpaper Calculator",
  description:
    "Calculate how many rolls of wallpaper you need for any room. Works for peel-and-stick, pre-pasted, and traditional wallpaper — pattern repeat waste included.",
  alternates: { canonical: "/wallpaper-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
