import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Define the specific product mappings
const UPGRADES = [
    {
        keys: ['sonos'],
        category: 'Sonos',
        products: [
            { name: "Sanus Wall Mount for Sonos", url: "https://www.amazon.com/s?k=sanus+wall+mount+sonos", note: "Secure, vibration-free mounting." },
            { name: "Sonos Era 100 Stand", url: "https://www.amazon.com/s?k=sonos+era+100+stand", note: "Ideal listening height." }
        ]
    },
    {
        keys: ['roku'],
        category: 'Roku',
        products: [
            { name: "Roku Voice Remote Pro", url: "https://www.amazon.com/s?k=roku+voice+remote+pro+rechargeable", note: "Rechargeable, backlit, and hands-free." },
            { name: "TotalMount for Roku", url: "https://www.amazon.com/s?k=totalmount+roku", note: "Clean setup attached to TV vents." }
        ]
    },
    {
        keys: ['samsung'],
        category: 'Samsung',
        products: [
            { name: "Samsung Slim Fit Wall Mount", url: "https://www.amazon.com/s?k=samsung+slim+fit+wall+mount", note: "The official zero-gap mount." },
            { name: "Samsung SolarCell Remote Replacement", url: "https://www.amazon.com/s?k=samsung+solarcell+remote+replacement", note: "Original replacement for newer models." }
        ]
    },
    {
        keys: ['ps5', 'playstation'],
        category: 'PlayStation',
        products: [
            { name: "PS5 DualSense Charging Station", url: "https://www.amazon.com/s?k=ps5+dualsense+charging+station", note: "Official click-in charging." },
            { name: "PS5 M.2 SSD Heatsink 2TB", url: "https://www.amazon.com/s?k=ps5+ssd+2tb+heatsink", note: "Essential storage expansion." }
        ]
    },
    {
        keys: ['lg'],
        category: 'LG',
        products: [
            { name: "LG Magic Remote Replacement", url: "https://www.amazon.com/s?k=lg+magic+remote+replacement", note: "Restore motion control and voice." },
            { name: "Screen Cleaning Kit", url: "https://www.amazon.com/s?k=screen+cleaner+kit+microfiber", note: "Safe for OLED screens." }
        ]
    }
];

function getFiles(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(function (file) {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFiles(file));
            } else {
                results.push(file);
            }
        });
    } catch (e) {
        console.warn(`Skipping search in ${dir}: ${e.message}`);
    }
    return results;
}

async function main() {
    console.log('--- Starting Affiliate Link Upgrade ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let upgradedCount = 0;
    let remainingGeneric = 0;

    for (const file of mdxFiles) {
        let content;
        try {
            content = fs.readFileSync(file, 'utf8');
        } catch (err) {
            console.error(`Error reading ${file}:`, err);
            continue;
        }

        let parsed;
        try {
            parsed = matter(content);
        } catch (e) {
            // Skip malformed files (already caught by health check)
            continue;
        }

        // Safety Check: Only touch files with the Generic Placeholder
        const hasGeneric = parsed.data.products?.some(p => p.name === "Screen Cleaning Kit" || p.name === "Certified Ultra High Speed HDMI Cable");

        if (!hasGeneric) {
            // This file is already customized or doesn't have products
            continue;
        }

        const filename = path.basename(file).toLowerCase();
        let match = null;

        // Find matching upgrade rule
        for (const rule of UPGRADES) {
            if (rule.keys.some(k => filename.includes(k))) {
                match = rule;
                break;
            }
        }

        if (match) {
            parsed.data.products = match.products;
            const newFileContent = matter.stringify(parsed.content, parsed.data);
            fs.writeFileSync(file, newFileContent);

            console.log(`Upgraded: ${path.basename(file)} -> ${match.category}`);
            upgradedCount++;
        } else {
            remainingGeneric++;
            // console.log(`Skipped (No match): ${path.basename(file)}`);
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Upgrade Complete.`);
    console.log(`Files Upgraded: ${upgradedCount}`);
    console.log(`Remaining Generic: ${remainingGeneric}`);
}

main().catch(console.error);
