import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-neutral-950/60">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-neutral-300/85">
        <p className="max-w-3xl">
          <strong>Affiliate disclosure:</strong> As an Amazon Associate, we may earn from qualifying purchases.
          This doesn&apos;t cost you extra and helps keep our guides independent.
        </p>

        <div className="mt-6 flex flex-wrap gap-6">
          <Link href="/disclosures" className="underline underline-offset-4 hover:text-white">
            Full disclosures
          </Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>

        <p className="mt-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} BuildGuiders. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
