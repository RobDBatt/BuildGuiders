
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');
const keyword = process.argv[2];

if (!keyword) {
    console.error('Usage: node scripts/scout-topics.mjs "Your Keyword"');
    console.error('Example: node scripts/scout-topics.mjs "PS5"');
    process.exit(1);
}

const PATTERNS = [
    (k) => `${k} not`,
    (k) => `${k} fix`,
    (k) => `Why is my ${k}`,
    (k) => `${k} error`
];

const IGNORED_TERMS = [
    'release date', 'price', 'buy', 'review', 'specs', 'features', 'vs', 'cost', 'near me', '2024', '2025'
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getSuggestions(query) {
    try {
        const url = `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return data[1] || [];
    } catch (err) {
        // console.error(`Failed to fetch for "${query}":`, err.message);
        return [];
    }
}

function getImageForCategory(category) {
    const cat = category.toLowerCase();
    if (cat.includes('tv') || cat.includes('television')) return '/images/gg/gg-tv-general.png';
    if (cat.includes('soundbar') || cat.includes('sonos') || cat.includes('speaker')) return '/images/gg/gg-soundbar.png';
    if (cat.includes('receiver') || cat.includes('denon') || cat.includes('yamaha')) return '/images/gg/gg-receiver.png';
    if (cat.includes('roku') || cat.includes('fire') || cat.includes('apple') || cat.includes('stream')) return '/images/gg/gg-streaming.png';
    if (cat.includes('ps5') || cat.includes('xbox') || cat.includes('game') || cat.includes('console')) return '/images/gg/gg-gaming-console.png';
    return '/images/gg/gg-smart-home-device.png'; // Default
}

function getUpgradeProduct(category) {
    const cat = category.toLowerCase();
    if (cat.includes('sonos')) return { name: "Newest Sonos Era 100", url: "https://www.amazon.com/s?k=sonos+era+100" };
    if (cat.includes('roku')) return { name: "Roku Ultra 4K", url: "https://www.amazon.com/s?k=roku+ultra+4k" };
    if (cat.includes('apple')) return { name: "Apple TV 4K", url: "https://www.amazon.com/s?k=apple+tv+4k" };
    if (cat.includes('ps5')) return { name: "PS5 Slim Console", url: "https://www.amazon.com/s?k=playstation+5+console" };
    if (cat.includes('tv')) return { name: "LG C3 OLED TV", url: "https://www.amazon.com/s?k=lg+c3+oled+tv" };
    return { name: "Upgraded Model", url: `https://www.amazon.com/s?k=${category}+upgrade` };
}

async function createDraft(topic, category, fixProduct) {
    const slug = topic.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const fileName = `${slug}.mdx`;
    const filePath = path.join(ARTICLES_DIR, fileName);
    const date = new Date().toISOString().split('T')[0];
    const imagePath = getImageForCategory(category);
    const upgrade = getUpgradeProduct(category);

    const fixUrl = `https://www.amazon.com/s?k=${encodeURIComponent(fixProduct)}`;

    const content = `---
slug: ${slug}
title: '${topic.replace(/'/g, "''")}'
brand: ${category.charAt(0).toUpperCase() + category.slice(1)}
category: ${category.toLowerCase()}
date: '${date}'
description: >-
  Step-by-step troubleshooting guide to fix "${topic}".
coverImage: ${imagePath}
products:
  - name: ${fixProduct}
    url: '${fixUrl}'
    note: 'Recommended fix for this specific issue.'
  - name: ${upgrade.name}
    url: '${upgrade.url}'
    note: 'Consider upgrading if your device is older.'
---

# ${topic}

## Quick Summary
If you are dealing with **${topic}**, it is often caused by a simple configuration error or a hardware limitation. Follow the steps below to get it working again.

## Symptoms
- Device not responding.
- Error message appearing on screen.
- Unexpected behavior during operation.

## Step-by-Step Fix

### 1. Restart your Device
The classic "turn it off and on again" works for 80% of these issues. Unplug it from the wall for 30 seconds.

### 2. Check Connections
Ensure all cables are securely plugged in. If you are using a ${fixProduct}, make sure it is compatible with your setup.

### 3. Update Firmware
Check for any pending software updates in the settings menu.

## Need to replace it?
If troubleshooting doesn't work, the hardware might be failing. We recommend the [${upgrade.name}](${upgrade.url}) as a reliable replacement.
`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ Draft Created: contents/articles/${fileName}`);
}

async function main() {
    console.log(`\n🔍 Scouting troubleshooting topics for: "${keyword}"...`);

    const queries = PATTERNS.map(p => p(keyword));
    const rawResults = await Promise.all(queries.map(q => getSuggestions(q)));

    const allSuggestions = new Set();
    rawResults.flat().forEach(s => {
        const text = s.toLowerCase().trim();
        const isIgnored = IGNORED_TERMS.some(term => text.includes(term));
        if (!isIgnored) allSuggestions.add(text);
    });

    const sortedList = Array.from(allSuggestions).sort();

    if (sortedList.length === 0) {
        console.log("No topics found.");
        rl.close();
        return;
    }

    while (true) {
        console.log('\n--- TOPICS FOUND ---');
        sortedList.forEach((topic, index) => {
            console.log(`${String(index + 1).padStart(2, ' ')}. ${topic}`);
        });
        console.log('--------------------');

        const answer = await askQuestion('\nEnter the number of the topic to write (or 0 to exit): ');
        const choice = parseInt(answer);

        if (isNaN(choice) || choice === 0) {
            console.log("Exiting...");
            break;
        }

        if (choice > 0 && choice <= sortedList.length) {
            const selectedTopic = sortedList[choice - 1];
            console.log(`\n📝 Selected: "${selectedTopic}"`);

            const category = await askQuestion('Which Device Category is this? (e.g. sonos, roku, ps5): ');
            const fixProduct = await askQuestion('What is the Recommended Fix Product? (e.g. Wall Mount): ');

            await createDraft(selectedTopic, category, fixProduct);

            await askQuestion('\nPress ENTER to continue...');
        } else {
            console.log("Invalid selection.");
        }
    }

    rl.close();
}

main();
