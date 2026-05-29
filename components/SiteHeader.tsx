// components/SiteHeader.tsx
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          BuildGuiders
        </Link>

        <nav className="flex gap-4 text-sm">
          <Link href="/articles" className="hover:underline">
            Articles
          </Link>
          <Link href="/categories" className="hover:underline">
            Categories
          </Link>
          <Link href="/brands" className="hover:underline">
            Brands
          </Link>
          <Link href="/categories" className="hover:underline">
            Sections
          </Link>
        </nav>
      </div>
    </header>
  );
}
