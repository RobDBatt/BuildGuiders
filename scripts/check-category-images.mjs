import fs from "node:fs";
import path from "node:path";

const REQUIRED = [
  "/images/categories/tv-display.jpg",
  "/images/categories/soundbar.jpg",
  "/images/categories/desktop-pc.jpg",
  "/images/categories/laptop.jpg",
  "/images/categories/cell-phone.jpg",
  "/images/categories/tablet.jpg",
  "/images/categories/projector.jpg",
  "/images/categories/cables-usbc-hdmi-ethernet.jpg",
  "/images/categories/av-receiver.jpg",
  "/images/categories/game-console.jpg",
  "/images/categories/smart-home-hub.jpg",
  "/images/categories/wifi-router.jpg",
  "/images/categories/smart-speaker.jpg",
  "/images/categories/power-charger.jpg",
  "/images/categories/headphones.jpg",
];

const publicDir = path.join(process.cwd(), "public");
const missing = [];

for (const rel of REQUIRED) {
  const filePath = path.join(publicDir, rel.replace(/^\/+/, ""));
  if (!fs.existsSync(filePath)) missing.push(rel);
}

if (missing.length) {
  console.error("❌ Missing images:\n" + missing.map(s => " - " + s).join("\n"));
  process.exit(1);
} else {
  console.log("✅ All category images present.");
}
