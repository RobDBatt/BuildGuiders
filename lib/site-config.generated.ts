// site-config.generated.ts — DO NOT EDIT BY HAND.
//
// Generated from portfolio-digest/config/sites.json by scripts/sync-site-config.mjs.
// Change the value THERE and re-run the generator; edits here are overwritten and the
// digest's drift check will fail.
//
// Last generated: 2026-07-27

/** Amazon Associates tracking ID for this site. Never cross-tag with another site's. */
export const AMAZON_TAG = "buildguiders-20" as const;

/** Canonical origin, including protocol and the canonical host. Use for metadataBase,
 *  canonical links, OpenGraph urls and sitemap entries. */
export const BASE_URL = "https://www.buildguiders.com" as const;

/** Which host is canonical. The other one must 301/308 to it — never 307, which does
 *  not consolidate ranking signals. */
export const CANONICAL_HOST = "www" as const;

export const APEX_HOST = "buildguiders.com" as const;
export const WWW_HOST = "www.buildguiders.com" as const;

/** The host that serves 200. */
export const CANONICAL_HOSTNAME = "www.buildguiders.com" as const;

/** Append this site's Associates tag to an amazon.* URL, replacing any existing tag. */
export function withAmazonTag(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (!/(^|\.)amazon\./i.test(u.hostname)) return rawUrl;
    u.searchParams.set('tag', AMAZON_TAG);
    return u.toString();
  } catch {
    return rawUrl;
  }
}
