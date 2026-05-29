import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Define the mapping
const IMAGE_MAP = [
    { keywords: ['receivers', 'amps', 'audio', 'receiver'], path: '/images/gg/gg-receiver.png' },
    { keywords: ['soundbars', 'speakers', 'soundbar'], path: '/images/gg/gg-soundbar.png' },
    { keywords: ['tvs', 'television', 'displays', 'tv'], path: '/images/gg/gg-tv-general.png' },
    { keywords: ['streaming', 'apple-tv', 'roku', 'fire-tv'], path: '/images/gg/gg-streaming.png' },
    { keywords: ['cables', 'hdmi', 'connections'], path: '/images/gg/gg-hdmi-cables.png' },
    { keywords: ['gaming', 'consoles', 'ps5', 'xbox', 'nintendo'], path: '/images/gg/gg-gaming-console.png' },
    { keywords: ['projectors'], path: '/images/gg/gg-projector.png' },
    { keywords: ['pc', 'computers', 'computer', 'desktop'], path: '/images/gg/gg-gaming-pc.png' },
    { keywords: ['laptops', 'laptop'], path: '/images/gg/gg-gaming-laptop.png' },

    // NEW: Catch-all buckets for the remaining 65 files
    { keywords: ['home-theater'], path: '/images/gg/gg-tv-general.png' },
    { keywords: ['troubleshooting'], path: '/images/gg/gg-hdmi-cables.png' },
    { keywords: ['general', 'smart-home', 'automation'], path: '/images/gg/gg-smart-home-device.png' },
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

function getImageForCategory(category) {
    if (!category) return null;
    const normalized = String(category).toLowerCase().trim();

    for (const entry of IMAGE_MAP) {
        // Check if the category string contains any of the keywords
        // We match if the normalized category includes the keyword (e.g. 'smart-tv' contains 'tv')
        // OR if the keyword matches the category exactly.
        for (const keyword of entry.keywords) {
            if (normalized.includes(keyword)) {
                return entry.path;
            }
        }
    }
    return null;
}

async function main() {
    console.log('--- Starting Bulk Image Assignment ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let updatedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;
    const unmatchedFiles = [];

    for (const file of mdxFiles) {
        let rawContent;
        try {
            rawContent = fs.readFileSync(file, 'utf8');
        } catch (err) {
            console.error(`Error reading ${file}:`, err);
            continue;
        }

        const parsed = matter(rawContent);
        const category = parsed.data.category;

        // Determine new image
        const newImage = getImageForCategory(category);

        if (newImage) {
            // Check if we actually need to update (avoid rewriting file if same)
            if (parsed.data.coverImage !== newImage) {
                parsed.data.coverImage = newImage;
                const newFileContent = matter.stringify(parsed.content, parsed.data);
                fs.writeFileSync(file, newFileContent);
                // console.log(`Updated: ${path.basename(file)} -> ${newImage}`);
                updatedCount++;
            } else {
                skippedCount++;
            }
        } else {
            // console.warn(`WARNING: No image match for category '${category}' in file: ${path.basename(file)}`);
            unmatchedFiles.push({ file: path.basename(file), category });
            noMatchCount++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Assignment Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (Already Correct): ${skippedCount}`);
    console.log(`No Match Found: ${noMatchCount}`);

    if (unmatchedFiles.length > 0) {
        console.log('\n--- Unmatched Files ---');
        unmatchedFiles.forEach(item => {
            console.log(`[${item.category || 'NO_CATEGORY'}] ${item.file}`);
        });
    }
}

main().catch(console.error);
