// scripts/apply-covers.mjs
// Run before build: updates coverImage/coverAlt in content/articles/*.mdx
// based on simple keyword-driven device categories.

import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const articlesDir = path.join(rootDir, "content", "articles");

function getAllMdxFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function decideCategoryKey(filePath, frontmatterRaw, body) {
  const fileName = path.basename(filePath);
  const haystack = (fileName + "\n" + frontmatterRaw + "\n" + body)
    .toLowerCase();

  let categoryKey = null;

  // 0a) Security Cameras
  if (/security|surveillance|blink|ring|nest cam|camera|doorbell/.test(haystack)) {
    categoryKey = "security-camera";
  }
  // 0b) Smart Locks
  else if (/smart lock|august|schlage|yale|deadbolt|keypad/.test(haystack)) {
    categoryKey = "smart-lock";
  }
  // 0c) Climate Control
  else if (/thermostat|climate|hvac|ecobee|nest learn|heating|cooling/.test(haystack)) {
    categoryKey = "climate-control";
  }
  // 0d) Network Gear
  else if (/router|mesh|wifi|wi-fi|modem|ethernet|network|signal|internet/.test(haystack)) {
    categoryKey = "network-gear";
  }
  // 1) Explicit hub: treat as general TV hub
  else if (fileName.includes("troubleshooting-hub")) {
    categoryKey = "tv";
  }
  // 2) HDMI / cable problems should win over soundbar, receiver, etc.
  else if (/hdmi|arc|earc|cable|switch|splitter|port/.test(haystack)) {
    categoryKey = "hdmi";
  }
  // 3) Projector-specific content
  else if (/projector/.test(haystack)) {
    categoryKey = "projector";
  }
  // 4) Streaming devices (Apple TV, Roku, Fire TV, Shield, etc.)
  else if (
    /apple tv|roku|fire tv|chromecast|nvidia shield|streaming|streamer|streaming stick|streaming box/.test(
      haystack,
    )
  ) {
    categoryKey = "streaming";
  }
  // 5) AV receivers
  else if (/receiver|avr|denon|onkyo|yamaha/.test(haystack)) {
    categoryKey = "receiver";
  }
  // 6) Soundbars
  else if (/soundbar/.test(haystack)) {
    categoryKey = "soundbar";
  }
  // 7) Gaming consoles
  else if (
    /ps5|ps4|xbox|series x|series s|playstation|switch|nintendo( console)?/.test(
      haystack,
    )
  ) {
    categoryKey = "gaming-console";
  }
  // 8) Gaming PCs
  else if (/gaming pc|gaming desktop|gaming tower/.test(haystack)) {
    categoryKey = "gaming-pc";
  }
  // 9) Gaming laptops
  else if (/gaming laptop/.test(haystack)) {
    categoryKey = "gaming-laptop";
  }
  // 10) Smart home (GENERAL FALLBACK)
  else if (
    /google home|nest|alexa|echo|homepod|smart display|smart speaker|smart hub/.test(
      haystack,
    )
  ) {
    categoryKey = "smart-home";
  }
  // 11) Headphones / headsets
  else if (/headphones|headset|earbuds|earphones/.test(haystack)) {
    categoryKey = "headphones";
  } else {
    // Fallback: treat as general TV article
    categoryKey = "tv";
  }

  return categoryKey;
}

function getCoverConfig(categoryKey) {
  switch (categoryKey) {
    case "security-camera":
      return {
        coverImage: "/images/covers/cover-security.png",
        coverAlt: "Security camera mounted on a wall with status light active",
        label: "Security Camera",
      };
    case "smart-lock":
      return {
        coverImage: "/images/covers/cover-locks.png",
        coverAlt: "Smart lock installed on a door with keypad",
        label: "Smart Lock",
      };
    case "climate-control":
      return {
        coverImage: "/images/covers/cover-climate.png",
        coverAlt: "Smart thermostat displaying temperature settings",
        label: "Climate Control",
      };
    case "network-gear":
      return {
        coverImage: "/images/covers/cover-network.png",
        coverAlt: "Wi-Fi router with antennas glowing green",
        label: "Network Gear",
      };
    case "streaming":
      return {
        coverImage: "/images/gg/gg-streaming.png",
        coverAlt: "Streaming device connected to a TV HDMI port",
        label: "Streaming",
      };
    case "soundbar":
      return {
        coverImage: "/images/gg/gg-soundbar.png",
        coverAlt: "Soundbar placed beneath a mounted TV",
        label: "Soundbar",
      };
    case "hdmi":
      return {
        coverImage: "/images/gg/gg-hdmi-cables.png",
        coverAlt: "HDMI cable plugged into the back of a TV",
        label: "HDMI & cables",
      };
    case "receiver":
      return {
        coverImage: "/images/gg/gg-receiver.png",
        coverAlt: "AV receiver with volume knob and display lights",
        label: "AV receiver",
      };
    case "gaming-console":
      return {
        coverImage: "/images/gg/gg-gaming-console.png",
        coverAlt:
          "Gaming console connected to a TV with controller nearby",
        label: "Gaming console",
      };
    case "gaming-pc":
      return {
        coverImage: "/images/gg/gg-gaming-pc.png",
        coverAlt: "Gaming PC with RGB lighting next to a monitor",
        label: "Gaming PC",
      };
    case "gaming-laptop":
      return {
        coverImage: "/images/gg/gg-gaming-laptop.png",
        coverAlt: "Gaming laptop on a desk with a controller",
        label: "Gaming laptop",
      };
    case "projector":
      return {
        coverImage: "/images/gg/gg-projector.png",
        coverAlt: "Home theater projector aimed at a screen",
        label: "Projector",
      };
    case "smart-home":
      return {
        coverImage: "/images/gg/gg-smart-home-device.png",
        coverAlt: "Smart home speaker on a table next to a lamp",
        label: "Smart home device",
      };
    case "headphones":
      return {
        coverImage: "/images/gg/gg-headphones.png",
        coverAlt: "Wireless headphones resting next to a TV remote",
        label: "Headphones / headset / earbuds",
      };
    case "tv":
    default:
      return {
        coverImage: "/images/gg/gg-tv-general.png",
        coverAlt:
          "Flat-screen TV on a stand with HDMI cables connected",
        label: "General TV",
      };
  }
}

function applyCovers() {
  if (!fs.existsSync(articlesDir)) {
    console.warn(
      `No content/articles directory found at ${articlesDir}, skipping.`,
    );
    return;
  }

  const files = getAllMdxFiles(articlesDir);

  if (!files.length) {
    console.warn("No .mdx files found under content/articles.");
    return;
  }

  for (const fullPath of files) {
    const relPath = path.relative(rootDir, fullPath);
    console.log(`\nProcessing: ${relPath}`);

    const raw = fs.readFileSync(fullPath, "utf8");

    // Split on lines that are exactly '---'
    const parts = raw.split(/^---\s*$/m);
    if (parts.length < 3) {
      console.warn("  Skipping (no valid frontmatter found).");
      continue;
    }

    const frontmatterRaw = parts[1];
    const body = parts.slice(2).join("---\n");

    const categoryKey = decideCategoryKey(fullPath, frontmatterRaw, body);
    const { coverImage, coverAlt, label } = getCoverConfig(categoryKey);

    console.log(`  Category: ${label} -> ${coverImage}`);

    const frontLines = frontmatterRaw.split(/\r?\n/);
    let hasCoverImage = false;
    let hasCoverAlt = false;

    for (let i = 0; i < frontLines.length; i++) {
      if (/^\s*coverImage\s*:/.test(frontLines[i])) {
        frontLines[i] = `coverImage: "${coverImage}"`;
        hasCoverImage = true;
      } else if (/^\s*coverAlt\s*:/.test(frontLines[i])) {
        frontLines[i] = `coverAlt: "${coverAlt}"`;
        hasCoverAlt = true;
      }
    }

    if (!hasCoverImage) {
      frontLines.push(`coverImage: "${coverImage}"`);
    }
    if (!hasCoverAlt) {
      frontLines.push(`coverAlt: "${coverAlt}"`);
    }

    const newFront = frontLines.join("\n") + "\n";
    const newBody = body.replace(/^\s+/, "");

    const newContent = `---\n${newFront}---\n${newBody}`;

    fs.writeFileSync(fullPath, newContent, "utf8");
  }

  console.log(
    "\nDone applying coverImage/coverAlt mappings to content/articles/*.mdx.",
  );
}

applyCovers();

