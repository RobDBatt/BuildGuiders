import "dotenv/config";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";

const DEFAULT_HOST = "webservices.amazon.com";
const DEFAULT_REGION = "us-east-1";
const DEFAULT_MARKETPLACE = "www.amazon.com";
const TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
const SERVICE = "ProductAdvertisingAPI";

const requiredEnv = [
  "PAAPI_ACCESS_KEY",
  "PAAPI_SECRET_KEY",
  "PAAPI_PARTNER_TAG",
];

function assertEnv() {
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Missing PA-API environment variables: ${missing.join(", ")}. ` +
        "Set them in .env and try again.",
    );
  }
}

function buildSigner({ region }) {
  return new SignatureV4({
    credentials: {
      accessKeyId: process.env.PAAPI_ACCESS_KEY,
      secretAccessKey: process.env.PAAPI_SECRET_KEY,
    },
    region,
    service: SERVICE,
    sha256: Sha256,
  });
}

function makeRequest({ host, body, region }) {
  const req = new HttpRequest({
    protocol: "https:",
    method: "POST",
    hostname: host,
    path: "/paapi5/searchitems",
    headers: {
      host,
      "content-type": "application/json; charset=utf-8",
      "content-encoding": "amz-1.0",
      "x-amz-target": TARGET,
    },
    body,
  });

  const signer = buildSigner({ region });
  return signer.sign(req);
}

function normalizeItems(json) {
  const items = json?.SearchResult?.Items || json?.ItemsResult?.Items || [];
  return items
    .map((item) => {
      const asin = item?.ASIN || item?.asin;
      const title =
        item?.ItemInfo?.Title?.DisplayValue ||
        item?.ItemInfo?.Title?.ShortTitle ||
        item?.title;
      const features = item?.ItemInfo?.Features?.DisplayValues || [];
      const image = item?.Images?.Primary?.Medium?.URL;
      return { asin, title, features, image };
    })
    .filter((i) => i.asin || i.title || i.image);
}

export async function searchItems({ keywords, searchIndex = "All", itemCount = 5 } = {}) {
  assertEnv();
  if (!keywords) {
    throw new Error("keywords is required");
  }

  const host = process.env.PAAPI_HOST || DEFAULT_HOST;
  const region = process.env.PAAPI_REGION || DEFAULT_REGION;
  const marketplace = process.env.PAAPI_MARKETPLACE || DEFAULT_MARKETPLACE;
  const partnerTag = process.env.PAAPI_PARTNER_TAG;

  const bodyObj = {
    Keywords: keywords,
    SearchIndex: searchIndex,
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: marketplace,
    ItemCount: itemCount,
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.Features",
      "Images.Primary.Medium",
    ],
  };

  const body = JSON.stringify(bodyObj);
  const signed = await makeRequest({ host, body, region });

  const res = await fetch(`https://${host}/paapi5/searchitems`, {
    method: "POST",
    headers: signed.headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PA-API SearchItems failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return normalizeItems(json);
}
