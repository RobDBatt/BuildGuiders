import "dotenv/config";
import { searchItems } from "./paapi.mjs";

const required = ["PAAPI_ACCESS_KEY", "PAAPI_SECRET_KEY", "PAAPI_PARTNER_TAG"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(
    `Missing required env vars for PA-API: ${missing.join(", ")}.\n` +
      "Set them in .env (PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, PAAPI_PARTNER_TAG) " +
      "and optionally PAAPI_REGION, PAAPI_HOST, PAAPI_MARKETPLACE.",
  );
  process.exit(1);
}

try {
  const items = await searchItems({
    keywords: "certified ultra high speed hdmi cable",
    itemCount: 3,
  });
  console.log(JSON.stringify(items, null, 2));
} catch (err) {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
}
