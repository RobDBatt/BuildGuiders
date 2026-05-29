/**
 * lib/amzn.ts
 * Minimal helpers to build Amazon URLs.
 * You can tweak locales, tags, etc. later.
 */

export function amznSearchUrl(query: string): string {
  const base = "https://www.amazon.com/s";
  const params = new URLSearchParams({ k: query });
  return `${base}?${params.toString()}`;
}

export function amznPdpUrl(asin: string): string {
  const base = "https://www.amazon.com/dp";
  return `${base}/${encodeURIComponent(asin)}`;
}
