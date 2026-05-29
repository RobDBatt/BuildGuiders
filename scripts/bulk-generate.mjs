import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');
const keyword = process.argv[2];

if (!keyword) {
    console.error('Usage: node scripts/bulk-generate.mjs "Your Keyword"');
    console.error('Example: node scripts/bulk-generate.mjs "Roku"');
    process.exit(1);
}

// 1. Brain: Solution & Image Mapping
const TAG = "buildguiders-20";
const AFFILIATE_NOTE = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

const SOLUTION_MAP = [
    {
        keys: ['remote', 'control', 'pairing', 'buttons'],
        fix: { name: "Universal Backlit Remote", url: `https://www.amazon.com/s?k=universal+backlit+remote&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['wifi', 'network', 'connect', 'internet', 'slow', 'buffering'],
        fix: { name: "TP-Link WiFi Range Extender", url: `https://www.amazon.com/s?k=TP-Link+WiFi+Range+Extender&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['power', 'won\'t turn on', 'shut off', 'restart'],
        fix: { name: "Surge Protector Power Strip", url: `https://www.amazon.com/s?k=surge+protector+power+strip&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['mount', 'install', 'wall', 'stand'],
        fix: { name: "Universal TV Wall Mount Kit", url: `https://www.amazon.com/s?k=universal+tv+wall+mount+kit&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['sound', 'audio', 'volume', 'hear', 'quiet'],
        fix: { name: "Certified Ultra High Speed HDMI Cable", url: `https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['hdmi', 'signal', 'black screen', 'picture'],
        fix: { name: "Certified Ultra High Speed HDMI Cable", url: `https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    // SECURITY & SMART HOME NICHE
    {
        keys: ['ring', 'blink', 'camera', 'doorbell', 'offline', 'battery'],
        fix: { name: "High-Capacity Replacement Battery", url: `https://www.amazon.com/s?k=ring+battery+pack+rechargeable&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['nest', 'thermostat', 'power', 'c-wire', 'wiring'],
        fix: { name: "Google Nest Power Connector", url: `https://www.amazon.com/s?k=google+nest+power+connector&tag=${TAG}` },
        note: AFFILIATE_NOTE
    },
    {
        keys: ['wifi', 'offline', 'disconnect', 'weak signal'],
        fix: { name: "TP-Link WiFi Range Extender", url: `https://www.amazon.com/s?k=wifi+extender+outdoor+long+range&tag=${TAG}` },
        note: AFFILIATE_NOTE
    }
];

const DEFAULT_FIX = { name: "Screen Cleaning Kit", url: `https://www.amazon.com/s?k=screen+cleaning+kit&tag=${TAG}` };

function getSolution(topic) {
    const t = topic.toLowerCase();
    for (const entry of SOLUTION_MAP) {
        if (entry.keys.some(k => t.includes(k))) {
            return { fix: entry.fix, note: entry.note };
        }
    }
    return { fix: DEFAULT_FIX, note: "Keep your gear in top condition." };
}

function getImageForCategory(cat) {
    const c = cat.toLowerCase();
    if (c.includes('roku') || c.includes('fire') || c.includes('apple') || c.includes('cast')) return '/images/gg/gg-streaming.png';
    if (c.includes('sonos') || c.includes('sound') || c.includes('speaker')) return '/images/gg/gg-soundbar.png';
    if (c.includes('ps5') || c.includes('xbox') || c.includes('game')) return '/images/gg/gg-gaming-console.png';
    if (c.includes('tv') || c.includes('monitor')) return '/images/gg/gg-tv-general.png';
    // Security & Smart Home
    if (c.includes('ring') || c.includes('blink') || c.includes('camera') || c.includes('nest') || c.includes('thermostat')) return '/images/gg/gg-smart-home-device.png';
    return '/images/gg/gg-smart-home-device.png';
}

// 2. Search Logic
const PATTERNS = [
    (k) => `${k} not`,
    (k) => `${k} fix`,
    (k) => `Why is my ${k}`,
    (k) => `${k} error`
];

async function getSuggestions(query) {
    try {
        const url = `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return data[1] || [];
    } catch (err) {
        return [];
    }
}

// 3. Shuffle Logic (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 4. Main Generation Logic
async function main() {
    console.log(`\n🚀 Starting Stealth Bulk Generation for: "${keyword}"\n`);

    // A. Fetch & Filter
    const queries = PATTERNS.map(p => p(keyword));
    const rawResults = await Promise.all(queries.map(q => getSuggestions(q)));

    let topics = new Set();
    const IGNORED = ['release date', 'price', 'buy', 'review', 'vs', 'near me', '2024', '2025'];

    rawResults.flat().forEach(s => {
        const val = s.toLowerCase().trim();
        if (!IGNORED.some(i => val.includes(i))) topics.add(val);
    });

    // Limit to 20 topics max for this batch
    let selectedTopics = Array.from(topics);

    // B. SHUFFLE (Organic Distribution)
    selectedTopics = shuffleArray(selectedTopics).slice(0, 20);

    console.log(`Found ${selectedTopics.length} valid topics. Scheduling...\n`);

    // C. Drip Schedule Loop
    let currentDate = new Date();
    let scheduledCount = 0;

    for (const topic of selectedTopics) {
        // Increment date (1-4 days)
        const daysToAdd = Math.floor(Math.random() * 4) + 1;
        currentDate.setDate(currentDate.getDate() + daysToAdd);

        const dateStr = currentDate.toISOString().split('T')[0];
        const slug = topic.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const filename = `${slug}.mdx`;
        const filePath = path.join(ARTICLES_DIR, filename);

        // Don't overwrite existing
        if (fs.existsSync(filePath)) {
            // console.log(`Skipping (Exists): ${filename}`);
            continue;
        }

        // Determine Content Details
        const { fix, note } = getSolution(topic);
        const image = getImageForCategory(keyword);

        // Frontmatter
        const content = `---
slug: ${slug}
title: '${topic.replace(/'/g, "''")}'
brand: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}
category: ${keyword.toLowerCase()}
date: '${dateStr}'
published: true
tags: []
description: >-
  How to troubleshoot and fix "${topic}" quickly.
coverImage: ${image}
products:
  - name: ${fix.name}
    description: Recommended accessory for resolving this issue.
    url: '${fix.url}'
    note: '${AFFILIATE_NOTE}'
---

# ${topic}

## Quick Guide
If you are struggling with **${topic}**, you are not alone. This is a common issue often caused by connection interuptions or software glitches.

## Troubleshooting Checklist

### 1. Power Cycle
Unplug your ${keyword} from power for 60 seconds. This simple step clears the cache and resolves 80% of temporary errors.

### 2. Check Your Environment
Ensure your device is not overheating and has a clear line of sight if it uses a remote.

### 3. Update Software
Go to the settings menu and check for the latest firmware update to ensure optimal performance.

## Recommended Fix
If the problem persists, many users find success by upgrading their setup. We recommend the [${fix.name}](${fix.url}) to resolve this issue and improve stability.
`;

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`📅 Scheduled: ${dateStr} | File: ${filename} | Fix: ${fix.name}`);
        scheduledCount++;
    }

    console.log(`\n✅ Successfully generated and scheduled ${scheduledCount} articles.`);
}

main();
