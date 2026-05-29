import Link from "next/link";

export type Card = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  updated?: string;
  brand?: string;
  device?: string;
  tags?: string[];
};

type Props = { articles: Card[] };

export default function ArticlesGrid({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <article
          key={a.slug}
          className="rounded-xl border border-white/10 p-4 hover:bg-white/5"
        >
          <h3 className="font-semibold leading-tight">
            <Link href={`/${a.slug}`} className="hover:underline">
              {a.title}
            </Link>
          </h3>
          {a.description ? (
            <p className="mt-2 text-sm text-neutral-300">{a.description}</p>
          ) : null}
          <div className="mt-3 text-xs text-neutral-400">
            {a.brand ? a.brand : ""}{a.device ? (a.brand ? " • " : "") + a.device : ""}
          </div>
        </article>
      ))}
    </div>
  );
}
