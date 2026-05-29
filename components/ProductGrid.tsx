export default function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="not-prose mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
