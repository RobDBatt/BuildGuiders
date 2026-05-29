import Link from "next/link";
import { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function NavLink({ href, children, className }: NavLinkProps) {
  if (!href) {
    return <span>{children}</span>;
  }

  return (
    <Link href={href} className={className ?? "hover:underline"}>
      {children}
    </Link>
  );
}
