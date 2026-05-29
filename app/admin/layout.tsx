import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="px-4 py-5 border-b border-neutral-800">
          <Link href="/admin" className="block">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
              BuildGuiders
            </div>
            <div className="text-lg font-semibold text-neutral-50">
              Admin Console
            </div>
          </Link>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          <AdminNavLink href="/admin">Overview</AdminNavLink>
          <AdminNavLink href="/admin/pipeline">Content Pipeline</AdminNavLink>
          <AdminNavLink href="/admin/articles">Articles</AdminNavLink>
          <AdminNavLink href="/admin/settings">System Settings</AdminNavLink>
          <AdminNavLink href="/admin/logs">Logs &amp; Errors</AdminNavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
