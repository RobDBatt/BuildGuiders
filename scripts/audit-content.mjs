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
    console.log('--- Starting Content Audit ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);
    console.log('---------------------------------------------------');
    console.log('Filename                                      <==>  Live URL Slug');
    console.log('---------------------------------------------------');

    const slugMap = new Map(); // slug -> [files]
    let articleCount = 0;

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
            console.error(`[ERROR] Failed to parse frontmatter in: ${path.basename(file)}`);
            continue;
        }
        const slug = parsed.data.slug;
        const filename = path.basename(file);

        if (slug) {
            // Store mapping
            if (!slugMap.has(slug)) {
                slugMap.set(slug, []);
            }
            slugMap.get(slug).push(file);

            // Print status (truncated filename for cleanliness)
            const visibleName = filename.length > 45 ? filename.substring(0, 42) + '...' : filename.padEnd(45);
            console.log(`${visibleName} <==>  ${slug}`);
            articleCount++;
        } else {
            console.warn(`[WARNING] No slug found in: ${filename}`);
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Total Articles Processed: ${articleCount}`);

    // Check for duplicates
    let duplicateCount = 0;
    console.log('\n--- DUPLICATE SLUG CHECK ---');

    slugMap.forEach((files, slug) => {
        if (files.length > 1) {
            duplicateCount++;
            console.error(`\n[ALERT] Duplicate Slug Detected: "${slug}"`);
            console.error(`Defined in files:`);
            files.forEach(f => console.error(` - ${path.relative(path.join(__dirname, '..'), f)}`));
        }
    });

    if (duplicateCount === 0) {
        console.log('✅ No duplicate slugs found.');
    } else {
        console.error(`\n❌ Found ${duplicateCount} slugs with conflicts.`);
    }
}

main().catch(console.error);
