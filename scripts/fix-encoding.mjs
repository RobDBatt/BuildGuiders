import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Replacement map - order is important to avoid partial matches on prefixes
// 'â€™' -> E2 80 99 (Right Single Quote)
// 'â€œ' -> E2 80 9C (Left Double Quote)
// 'â€“' -> E2 80 93 (En Dash)
// 'â€”' -> E2 80 94 (Em Dash)
// 'â€\x9d' -> E2 80 9D (Right Double Quote - often shows as â€ or â€” in some view, but let's handle the explicit ones first)
// 'Â' -> C2 A0 (NBSP)

const REPLACEMENTS = [
    { search: /â€™/g, replace: "'" },
    { search: /â€œ/g, replace: '"' },
    { search: /â€“/g, replace: '-' },
    { search: /â€”/g, replace: '-' },
    // Handle the "â€" which typically represents the Right Double Quote when decoded purely as CP1252 from UTF-8 E2 80 9D. 
    // In CP1252, 0x9D is undefined, so it often just shows â€ (from E2 80).
    // We match explicitly undefined ones or just the prefix if it's loose, but user asked for "â€".
    // Note: We've already replaced â€“ (E2 80 93) and â€” (E2 80 94) and â€œ (E2 80 9C).
    // Safe to replace remaining â€ sequence if it's intended as right quote.
    { search: /â€\x9d/g, replace: '"' }, // Specific
    { search: /â€/g, replace: '"' },     // Fallback for user request, after others
    { search: /Ã¢â‚¬â„¢/g, replace: "'" }, // Double mojibake sometimes
    { search: /Â/g, replace: "" },       // NBSP artifact
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
    console.log('--- Starting Encoding Fix (Mojibake Cleanup) ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let fileCount = 0;
    let totalReplacements = 0;

    for (const file of mdxFiles) {
        let content;
        try {
            content = fs.readFileSync(file, 'utf8');
        } catch (err) {
            console.error(`Error reading ${file}:`, err);
            continue;
        }

        let modified = content;

        // Apply replacements
        for (const item of REPLACEMENTS) {
            modified = modified.replace(item.search, item.replace);
        }

        if (modified !== content) {
            fs.writeFileSync(file, modified, 'utf8');
            console.log(`Fixed encoding in: ${path.basename(file)}`);
            fileCount++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Cleanup Complete.`);
    console.log(`Files Fixed: ${fileCount}`);
}

main().catch(console.error);
