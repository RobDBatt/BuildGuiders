import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Helper to get all files recursively
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
    console.log('--- Starting Site Health Check ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    let failures = []; // { file, reason }
    let genericFiles = [];
    let customCount = 0;

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

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
            failures.push({ file: path.basename(file), reason: 'Frontmatter Parsing Error' });
            continue;
        }

        const data = parsed.data;
        const filename = path.basename(file);
        let isFailure = false;

        // Critical Check 1: Revenue
        if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
            failures.push({ file: filename, reason: 'Missing Products' });
            isFailure = true;
        }

        // Critical Check 2: Images
        if (data.coverImage && (String(data.coverImage).includes('.jpg') || String(data.coverImage).includes('.jpeg'))) {
            failures.push({ file: filename, reason: 'Image has .jpg/.jpeg extension' });
            isFailure = true;
        }

        if (isFailure) continue;

        // Content Check 3: Generic Detect
        let isGeneric = false;
        // Check if any product name matches the specific generic strings
        if (data.products && data.products.some(p =>
            p.name === "Screen Cleaning Kit" ||
            p.name === "Certified Ultra High Speed HDMI Cable"
        )) {
            isGeneric = true;
        }

        if (isGeneric) {
            genericFiles.push(filename);
        } else {
            customCount++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Total Files Scanned: ${mdxFiles.length}`);

    if (failures.length > 0) {
        console.log('\n❌ [RED ALERT] CRITICAL FAILURES FOUND:');
        failures.forEach(f => console.log(` - ${f.file}: ${f.reason}`));
    } else {
        console.log('\n✅ No Critical Failures Found (All images PNG, all files have revenue blocks).');
    }

    console.log(`\n⚠️ [YELLOW NOTICE] Generic Recommendations Used: ${genericFiles.length}`);
    if (genericFiles.length > 0) {
        console.log('Sample (first 10):');
        genericFiles.slice(0, 10).forEach(f => console.log(` - ${f}`));
    }

    console.log(`\n✅ [GREEN SUCCESS] Custom Recommendations: ${customCount}`);

    if (failures.length === 0) {
        console.log('\nResult: SYSTEM READY FOR DEPLOY');
    } else {
        console.log('\nResult: FIX CRITICAL ERRORS BEFORE DEPLOY');
    }
}

main().catch(console.error);
