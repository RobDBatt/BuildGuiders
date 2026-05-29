import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// The Rescue Map
const RESCUE_MAP = {
    "apple-tv-youtube-4k-hdr.mdx": {
        title: "Fix Apple TV YouTube 4K HDR Black Screen",
        description: "Troubleshooting guide for fixing black screen or dropout issues when playing 4K HDR content on YouTube via Apple TV.",
        brand: "Apple",
        category: "Streaming",
        coverImage: "/images/gg/gg-streaming.png",
        products: [
            { name: "Certified Ultra High Speed HDMI Cable", url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps", note: "Essential for 4K HDR bandwidth." },
            { name: "Belkin Ethernet Cable", url: "https://www.amazon.com/s?k=cat6+ethernet+cable", note: "Stable connection for 4K streaming." }
        ]
    },
    "hdmi-arc-vs-earc-differences.mdx": {
        title: "HDMI ARC vs eARC: Differences Explained",
        description: "Understanding the difference between ARC and eARC for uncompressed audio and Dolby Atmos.",
        brand: "General",
        category: "Home Theater",
        coverImage: "/images/gg/gg-hdmi-cables.png",
        products: [
            { name: "Certified Ultra High Speed HDMI Cable", url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps", note: "Required for eARC stability." },
            { name: "LG S95QR Soundbar", url: "https://www.amazon.com/s?k=lg+soundbar+earc", note: "Top-tier eARC soundbar." }
        ]
    },
    "laptop-usbc-to-monitor-when-it-works.mdx": {
        title: "Laptop USB-C to Monitor Not Working? Fixes",
        description: "How to fix USB-C connection issues when connecting your laptop to an external monitor.",
        brand: "General",
        category: "PC",
        coverImage: "/images/gg/gg-gaming-laptop.png",
        products: [
            { name: "Anker USB-C Hub", url: "https://www.amazon.com/s?k=anker+usb-c+hub", note: "Expands connectivity." },
            { name: "Thunderbolt 4 Cable", url: "https://www.amazon.com/s?k=thunderbolt+4+cable", note: "High bandwidth for 4K/60Hz." }
        ]
    },
    "phone-wont-screen-mirror-to-tv-fixes.mdx": {
        title: "Phone Won't Screen Mirror to TV: Troubleshooting",
        description: "Fixing AirPlay, Miracast, and casting issues from iPhone or Android to your TV.",
        brand: "General",
        category: "Mobile",
        coverImage: "/images/gg/gg-smart-home-device.png",
        products: [
            { name: "Roku Express 4K+", url: "https://www.amazon.com/s?k=roku+express+4k", note: "Reliable AirPlay support." },
            { name: "Google Chromecast 4K", url: "https://www.amazon.com/s?k=chromecast+with+google+tv+4k", note: "Best for Android casting." }
        ]
    },
    "ps5-wont-output-4k-hdr-fix.mdx": {
        title: "PS5 Won't Output 4K HDR: Handshake Fixes",
        description: "Steps to resolve black screens or 'Signal Not Supported' errors when setting up 4K HDR on PS5.",
        brand: "Sony",
        category: "Gaming",
        coverImage: "/images/gg/gg-gaming-console.png",
        products: [
            { name: "Certified Ultra High Speed HDMI Cable", url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps", note: "Mandatory for 4K 120Hz HDR." },
            { name: "PS5 Cooling Stand", url: "https://www.amazon.com/s?k=ps5+cooling+stand", note: "Keep your console running cool." }
        ]
    },
    "tcl-tv-hdmi-no-signal-or-black-screen.mdx": {
        title: "TCL TV HDMI No Signal or Black Screen Fix",
        description: "How to reset your TCL TV inputs and fix HDMI handshake issues.",
        brand: "TCL",
        category: "TV",
        coverImage: "/images/gg/gg-tv-general.png",
        products: [
            { name: "Power Strip with Surge Protection", url: "https://www.amazon.com/s?k=surge+protector+strip", note: "Protect sensitive HDMI boards." },
            { name: "Certified Ultra High Speed HDMI Cable", url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps", note: "Rule out bad cables first." }
        ]
    },
    "vizio-tv-hdmi-no-signal-or-flickering-4k.mdx": {
        title: "Vizio TV HDMI No Signal or Flickering Fix",
        description: "Solutions for Vizio TVs dropping signal or flickering when using 4K sources.",
        brand: "Vizio",
        category: "TV",
        coverImage: "/images/gg/gg-tv-general.png",
        products: [
            { name: "Certified Ultra High Speed HDMI Cable", url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps", note: "Common fix for flickering." },
            { name: "Universal Remote", url: "https://www.amazon.com/s?k=universal+remote+for+vizio+tv", note: "If your remote is laggy." }
        ]
    }
};

async function main() {
    console.log('--- Starting Rescue of 7 Broken Files ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    let fixedCount = 0;

    for (const [filename, info] of Object.entries(RESCUE_MAP)) {
        const filePath = path.join(ARTICLES_DIR, filename);
        const slug = filename.replace('.mdx', '');
        const date = new Date().toISOString().split('T')[0];

        // Construct YAML Frontmatter
        let frontmatter = `---
slug: ${slug}
title: '${info.title.replace(/'/g, "''")}'
brand: ${info.brand}
category: ${info.category}
date: '${date}'
description: >-
  ${info.description}
coverImage: ${info.coverImage}
products:
`;

        // Add products
        info.products.forEach(p => {
            frontmatter += `  - name: ${p.name}\n`;
            frontmatter += `    url: '${p.url}'\n`;
            frontmatter += `    note: '${p.note}'\n`;
        });

        frontmatter += `---

# ${info.title}

## Quick Summary
If you are experiencing issues with ${info.brand} devices, typically related to ${info.category.toLowerCase()} setups, follow the checklist below to restore your connection.

## Symptoms
- Black screen or "No Signal" message.
- Flickering video or audio dropouts.
- Device not recognized by TV or Receiver.

## Troubleshooting Steps

### 1. Hard Reset All Devices
Unplug your TV and source device from the wall for at least 60 seconds. This clears the HDMI protection handshake cache.

### 2. Check Your Cables
Ensure you are using a **Certified High Speed** cable. Many generic cables fail at 4K/HDR bandwidths.

### 3. Adjust Settings
- **TV:** Ensure "Enhanced HDMI" or "Deep Color" is enabled on the input port.
- **Source:** Try lowering the resolution to 1080p to see if the signal returns.

## Need More Help?
If replacing the cable doesn't work, the issue might be with the port itself. Try moving to HDMI Port 2 or 3.
`;

        fs.writeFileSync(filePath, frontmatter, 'utf8');
        console.log(`Rescued: ${filename}`);
        fixedCount++;
    }

    console.log('---------------------------------------------------');
    console.log(`\nRescue Complete. Fixed ${fixedCount} files.`);
}

main().catch(console.error);
