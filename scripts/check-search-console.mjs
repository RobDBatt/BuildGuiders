import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function log(...args) {
  // Simple wrapper in case we want to tweak output later.
  console.log(...args);
}

function checkHtmlVerification() {
  const publicDir = path.join(ROOT, "public");
  if (!fs.existsSync(publicDir) || !fs.statSync(publicDir).isDirectory()) {
    return [];
  }

  const entries = fs.readdirSync(publicDir, { withFileTypes: true });
  const matches = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().startsWith("google") &&
        entry.name.toLowerCase().endsWith(".html"),
    )
    .map((entry) => `public/${entry.name}`);

  if (matches.length > 0) {
    log("Found Google verification HTML file(s) in public/:");
    for (const file of matches) {
      log(`- ${file}`);
    }
  }

  return matches;
}

function checkMetaVerification() {
  const candidates = ["app/layout.tsx", "app/head.tsx"];
  const foundIn = [];

  for (const relative of candidates) {
    const fullPath = path.join(ROOT, relative);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      continue;
    }

    const contents = fs.readFileSync(fullPath, "utf8");
    if (contents.includes("google-site-verification")) {
      log(`Found google-site-verification meta tag in ${relative}`);
      foundIn.push(relative);
    }
  }

  return foundIn;
}

function main() {
  const htmlFiles = checkHtmlVerification();
  const metaLocations = checkMetaVerification();

  if (htmlFiles.length === 0 && metaLocations.length === 0) {
    log("No Google Search Console verification file or meta tag found.");
    log(
      "You may still need to verify the domain in Google Search Console and add either:",
    );
    log("- a verification HTML file under public/, or");
    log(
      "- a <meta name=\"google-site-verification\" ...> tag in your root layout/head.",
    );
  } else {
    log(
      "Search Console verification appears to be present (see details above).",
    );
  }

  // Informational script only; always exit 0.
  process.exitCode = 0;
}

main();

