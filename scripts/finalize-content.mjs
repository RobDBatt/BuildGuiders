import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Default products to inject if missing
const DEFAULT_PRODUCTS = [
    {
        name: "Certified Ultra High Speed HDMI Cable",
        url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable+48gbps",
        note: "Fixes 90% of black screen and audio drop issues."
    },
    {
        name: "Screen Cleaning Kit",
        url: "https://www.amazon.com/s?k=screen+cleaner+kit+microfiber",
        note: "Keep your display streak-free and safe."
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
    console.log('--- Starting Content Finalization ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let filesUpdated = 0;

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
            console.error(`Error parsing ${file}: ${e.message}`);
            continue;
        }

        let hasChanges = false;

        // 1. Image Fix: .jpg -> .png in coverImage
        if (parsed.data.coverImage && typeof parsed.data.coverImage === 'string') {
            if (parsed.data.coverImage.endsWith('.jpg')) {
                parsed.data.coverImage = parsed.data.coverImage.replace('.jpg', '.png');
                hasChanges = true;
            }
        }

        // 2. Revenue Injection: Add default products if missing
        if (!parsed.data.products) {
            parsed.data.products = DEFAULT_PRODUCTS;
            hasChanges = true;
        }

        if (hasChanges) {
            const newFileContent = matter.stringify(parsed.content, parsed.data);
            fs.writeFileSync(file, newFileContent);
            filesUpdated++;
            // console.log(`Updated: ${path.basename(file)}`);
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Finalization Complete.`);
    console.log(`Files Updated: ${filesUpdated}`);
}

main().catch(console.error);
