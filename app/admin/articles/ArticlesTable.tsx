"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ArticleRecord = {
  id?: string;
  title?: string;
  slug?: string;
  url?: string;
  brands?: string[] | string;
  category?: string | null;
  status?: string;
  score?: number | string | null;
  date?: string;
};

type SortKey = "score" | "date" | "brandCount" | "title";

interface ArticlesTableProps {
  initialArticles: ArticleRecord[];
}

export function ArticlesTable({ initialArticles }: ArticlesTableProps) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Normalize brands & categories and compute distinct lists for filters
  const enrichedArticles = useMemo(() => {
    return (initialArticles ?? []).map((a) => {
      const brandList: string[] = Array.isArray(a.brands)
        ? a.brands.filter((b) => typeof b === "string" && b.trim().length > 0)
        : typeof a.brands === "string" && a.brands.trim().length > 0
          ? a.brands
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
          : [];

      const category =
        typeof a.category === "string" && a.category.trim().length > 0
          ? a.category.trim()
          : null;

      const score =
        typeof a.score === "string"
          ? parseFloat(a.score)
          : typeof a.score === "number"
            ? a.score
            : NaN;

      const parsedDate = a.date ? Date.parse(a.date) : 0;

      const status = (a.status ?? "drafted").toLowerCase();

      const hasMissingMeta = brandList.length === 0 || !category;

      return {
        ...a,
        brands: brandList,
        category,
        score,
        parsedDate,
        status,
        hasMissingMeta,
        brandCount: brandList.length,
      } as ArticleRecord & {
        brands: string[];
        category: string | null;
        score: number;
        parsedDate: number;
        status: string;
        hasMissingMeta: boolean;
        brandCount: number;
      };
    });
  }, [initialArticles]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    for (const a of enrichedArticles) {
      for (const b of a.brands ?? []) {
        if (b && b.trim().length) set.add(b.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enrichedArticles]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const a of enrichedArticles) {
      if (a.category) set.add(a.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enrichedArticles]);

  const filteredAndSorted = useMemo(() => {
    let rows = [...enrichedArticles];

    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      rows = rows.filter((a) => {
        const title = (a.title ?? "").toLowerCase();
        const slug = (a.slug ?? "").toLowerCase();
        return title.includes(q) || slug.includes(q);
      });
    }

    if (brandFilter !== "all") {
      rows = rows.filter((a) =>
        (a.brands ?? []).some(
          (b) => b.toLowerCase() === brandFilter.toLowerCase()
        )
      );
    }

    if (categoryFilter !== "all") {
      rows = rows.filter(
        (a) =>
          a.category &&
          a.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    rows.sort((a, b) => {
      let cmp = 0;

      if (sortKey === "score") {
        const av = isNaN(a.score as number) ? -Infinity : (a.score as number);
        const bv = isNaN(b.score as number) ? -Infinity : (b.score as number);
        cmp = av - bv;
      } else if (sortKey === "date") {
        cmp = (a.parsedDate ?? 0) - (b.parsedDate ?? 0);
      } else if (sortKey === "brandCount") {
        cmp = (a.brandCount ?? 0) - (b.brandCount ?? 0);
      } else if (sortKey === "title") {
        cmp = (a.title ?? "").localeCompare(b.title ?? "");
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [enrichedArticles, search, brandFilter, categoryFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        return currentKey;
      } else {
        setSortDir("desc");
        return key;
      }
    });
  }

  function sortLabel(key: SortKey) {
    const isActive = sortKey === key;
    const arrow = !isActive ? "↕" : sortDir === "asc" ? "↑" : "↓";

    if (key === "score") return `Score ${arrow}`;
    if (key === "date") return `Date ${arrow}`;
    if (key === "brandCount") return `Brands ${arrow}`;
    if (key === "title") return `Title ${arrow}`;
    return arrow;
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-64 rounded-full border border-gray-700 bg-black/60 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-100">
                {filteredAndSorted.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-100">
                {enrichedArticles.length}
              </span>{" "}
              articles
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Brand filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-full border border-gray-700 bg-black/60 px-3 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All brands</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-gray-700 bg-black/60 px-3 py-1.5 text-xs text-gray-100 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort toggles */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => toggleSort("score")}
              className={`rounded-full border px-2 py-1 text-[11px] ${sortKey === "score"
                  ? "border-sky-500 bg-sky-500/20 text-sky-100"
                  : "border-gray-700 bg-black/40 text-gray-300 hover:border-sky-500"
                }`}
            >
              {sortLabel("score")}
            </button>
            <button
              type="button"
              onClick={() => toggleSort("date")}
              className={`rounded-full border px-2 py-1 text-[11px] ${sortKey === "date"
                  ? "border-sky-500 bg-sky-500/20 text-sky-100"
                  : "border-gray-700 bg-black/40 text-gray-300 hover:border-sky-500"
                }`}
            >
              {sortLabel("date")}
            </button>
            <button
              type="button"
              onClick={() => toggleSort("brandCount")}
              className={`rounded-full border px-2 py-1 text-[11px] ${sortKey === "brandCount"
                  ? "border-sky-500 bg-sky-500/20 text-sky-100"
                  : "border-gray-700 bg-black/40 text-gray-300 hover:border-sky-500"
                }`}
            >
              {sortLabel("brandCount")}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-black/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-800 bg-black/60 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Brands</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((a) => {
              const slug = a.slug ?? "";
              const articleUrl = a.url ?? `/${slug}`;

              const brandsDisplay =
                (a.brands as string[]) && (a.brands as string[]).length > 0
                  ? (a.brands as string[]).join(", ")
                  : "—";

              const categoryDisplay =
                typeof a.category === "string" && a.category.length > 0
                  ? a.category
                  : "—";

              const isDraftLike =
                a.status &&
                !["published", "approved"].includes(a.status.toLowerCase());
              const hasMissingMeta = (a as any).hasMissingMeta;

              let rowHighlight = "";
              if (hasMissingMeta) {
                rowHighlight = "bg-red-950/40";
              } else if (isDraftLike) {
                rowHighlight = "bg-amber-950/20";
              }

              const scoreDisplay =
                typeof a.score === "number" && !isNaN(a.score)
                  ? a.score.toFixed(0)
                  : "—";

              return (
                <tr
                  key={a.id ?? slug ?? articleUrl}
                  className={`border-b border-gray-800/60 last:border-0 hover:bg-black/60 ${rowHighlight}`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={articleUrl}
                        target="_blank"
                        className="font-medium hover:underline"
                      >
                        {a.title}
                      </Link>

                      <div className="text-xs text-gray-500">{a.slug}</div>

                      {articleUrl !== "#" && (
                        <Link
                          href={articleUrl}
                          className="text-[11px] text-blue-400 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on site
                        </Link>
                      )}

                      {hasMissingMeta && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Missing brands/category
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs align-top">
                    <StatusPill status={a.status ?? "drafted"} />
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-300 align-top">
                    {brandsDisplay}
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-300 align-top">
                    {categoryDisplay}
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-300 text-right align-top">
                    {scoreDisplay}
                  </td>
                </tr>
              );
            })}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-400"
                >
                  No articles match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    published: "bg-green-500/20 text-green-100 border-green-500/40",
    awaiting_review: "bg-amber-500/20 text-amber-100 border-amber-500/40",
    drafted: "bg-gray-500/20 text-gray-100 border-gray-500/40",
    rejected: "bg-red-500/20 text-red-100 border-red-500/40",
    discovered: "bg-sky-500/20 text-sky-100 border-sky-500/40",
    planned: "bg-sky-500/20 text-sky-100 border-sky-500/40",
    approved: "bg-green-500/20 text-green-100 border-green-500/40",
    archived: "bg-gray-700/40 text-gray-200 border-gray-700/80",
  };

  const cls =
    map[key] ?? "bg-gray-500/20 text-gray-100 border-gray-500/40";

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}
