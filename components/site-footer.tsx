import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="border-t bg-transparent border-slate-800/50 py-6 mt-20 backdrop-blur-sm">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-6 mx-auto max-w-6xl">
                <p className="text-center text-sm leading-loose text-neutral-400 md:text-left">
                    © 2025-2026 Build Guiders. All rights reserved.
                    <span className="ml-2 italic text-xs">Essential Guides for HVAC & Climate Systems.</span>
                </p>
                <nav className="flex items-center space-x-4 text-sm font-medium">
                    <Link href="/about" className="text-neutral-400 hover:text-[#f97316] transition-colors">About</Link>
                    <Link href="/privacy" className="text-neutral-400 hover:text-[#f97316] transition-colors">Privacy</Link>
                    <Link href="/contact" className="text-neutral-400 hover:text-[#f97316] transition-colors">Contact</Link>
                    <Link href="/disclosures" className="text-neutral-400 hover:text-[#f97316] transition-colors">Affiliate Disclosure</Link>
                </nav>
            </div>
        </footer>
    )
}
