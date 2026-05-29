// app/not-found.tsx

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50">
          We couldn&apos;t find that guide.
        </h1>
        <p className="text-sm text-neutral-400">
          It may have been moved, renamed, or never existed. Try browsing all
          guides or head back to the homepage to explore troubleshooting tips
          for TVs, receivers, HDMI, and streaming gear.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/articles"
          className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-neutral-950 shadow-sm transition hover:bg-sky-400 sm:w-auto"
        >
          Browse all guides
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-sky-300 hover:text-sky-200"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

