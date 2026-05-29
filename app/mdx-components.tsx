import Link from "next/link";
import { ReactNode } from "react";
import DiagramHdmiChain from "@/components/diagrams/DiagramHdmiChain";
import DiagramArcEarc from "@/components/diagrams/DiagramArcEarc";
import DiagramSoundbarSetup from "@/components/diagrams/DiagramSoundbarSetup";
import DiagramWifiMesh from "@/components/diagrams/DiagramWifiMesh";
import DiagramOpticalVsHdmi from "@/components/diagrams/DiagramOpticalVsHdmi";
import GGHdmiCableRecommendation from "@/components/recommendations/GGHdmiCableRecommendation";
import GgProduct from "@/components/GgProduct";

type AffiliateLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

function AffiliateLink({ href, children, className }: AffiliateLinkProps) {
  if (!href) {
    return <span>{children}</span>;
  }

  const isExternal = href.startsWith("http");

  const commonProps = {
    className: className ?? "underline",
  };

  if (isExternal) {
    return (
      <a
        href={href}
        {...commonProps}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...commonProps}>
      {children}
    </Link>
  );
}

// We don't strictly need MDXComponents types here; `any` is fine for v1.
export function useMDXComponents(components: any): any {
  return {
    // Use AffiliateLink for <a> tags by default
    a: AffiliateLink,
    DiagramHdmiChain,
    DiagramArcEarc,
    DiagramSoundbarSetup,
    DiagramWifiMesh,
    DiagramOpticalVsHdmi,
    GGHdmiCableRecommendation,
    GgProduct,
    ...components,
  };
}
