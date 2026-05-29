import Link from "next/link";
import { ReactNode } from "react";

function Callout(props: { type?: "info" | "warn" | "success"; children: ReactNode }) {
  const t = props.type ?? "info";
  let bg = "bg-blue-50 border-blue-200";
  if (t === "warn") bg = "bg-yellow-50 border-yellow-200";
  if (t === "success") bg = "bg-emerald-50 border-emerald-200";

  return (
    <div className={`my-4 rounded-md border px-4 py-3 text-sm ${bg}`}>
      {props.children}
    </div>
  );
}

/**
 * Simple helper to provide extra MDX components.
 * We intentionally avoid mdx/types here and just use `any` to keep types happy.
 */
export function libMdxComponents(components: any = {}): any {
  return {
    a: (props: any) => (
      <Link href={props.href ?? "#"} className="underline">
        {props.children}
      </Link>
    ),
    Callout,
    ...components,
  };
}
