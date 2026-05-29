export const AMAZON_TAG =
  process.env.NEXT_PUBLIC_AMAZON_TAG || "buildguiders-20";

/** Append your Associates tag to any amazon.* URL (keeps other params intact). */
export function withAmazonTag(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.includes("amazon.")) {
      if (!u.searchParams.has("tag")) u.searchParams.set("tag", AMAZON_TAG);
      return u.toString();
    }
    return raw;
  } catch {
    const sep = raw.includes("?") ? "&" : "?";
    return raw + sep + "tag=" + encodeURIComponent(AMAZON_TAG);
  }
}

/** Slug -> outbound URL map (replace ASINs with real ones) */
export const OUTLINKS: Record<string, string> = {
  "hdmi-48g": withAmazonTag("https://www.amazon.com/dp/XXXXXXXX"),
  "fiber-hdmi-48g": withAmazonTag("https://www.amazon.com/dp/YYYYYYYY"),
  "uhd-switch-48g": withAmazonTag("https://www.amazon.com/dp/ZZZZZZZZ"),
  "avr-21": withAmazonTag("https://www.amazon.com/dp/AAAAAAAA"),
};
