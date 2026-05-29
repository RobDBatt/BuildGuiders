import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center group">
          <div className="mr-3 h-3 w-3 rounded-full bg-[#f97316] shadow-[0_0_10px_#f97316] group-hover:animate-pulse" />
          <span className="text-3xl font-black tracking-[0.15em] text-white uppercase leading-none"
            style={{ fontFamily: "'TT Autonomous', 'Inter', sans-serif" }}>
            Build <span className="text-[#f97316]">Guiders</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/articles" className="hover:text-white transition-colors">Guides</Link>
          <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
          <Link href="/brands" className="hover:text-white transition-colors">Brands</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </header>
  )
}
