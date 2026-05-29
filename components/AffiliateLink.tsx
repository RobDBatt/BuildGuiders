import Link from "next/link";
import { ReactNode } from "react";

type AffiliateLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function AffiliateLink({
  href,
  children,
  className,
}: AffiliateLinkProps) {
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
