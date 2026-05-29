import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to content/articles
const ARTICLES_DIR = path.join(__dirname, '../content/articles');

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

function shouldMigrateUrl(url) {
    if (!url) return false;
    // User Logic: IF url contains "/dp/" OR does not contain "/s?k="
    // This simplifies to: if it doesn't have /s?k=, we migrate it.
    // (Because if it has /dp/, it won't have /s?k=, so it returns true)

    return !url.includes('/s?k=');
}

async function main() {
    console.log('--- Starting Migration of Affiliate Links ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let updatedCount = 0;

    for (const file of mdxFiles) {
        let rawContent;
        try {
            rawContent = fs.readFileSync(file, 'utf8');
        } catch (err) {
            console.error(`Error reading ${file}:`, err);
            continue;
        }

        const parsed = matter(rawContent);
        let hasChanges = false;

        if (parsed.data.products && Array.isArray(parsed.data.products)) {
            parsed.data.products = parsed.data.products.map(product => {
                if (shouldMigrateUrl(product.url)) {
                    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`;
                    // Only mark as changed if the URL is actually different
                    if (product.url !== searchUrl) {
                        hasChanges = true;
                        return {
                            ...product,
                            url: searchUrl
                        };
                    }
                }
                return product;
            });
        }

        if (hasChanges) {
            console.log(`Migrated links in: ${path.basename(file)}`);
            // Reconstitute the file
            const newFileContent = matter.stringify(parsed.content, parsed.data);
            fs.writeFileSync(file, newFileContent);
            updatedCount++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Migration Complete. Updated ${updatedCount} files.`);
}

main().catch(console.error);
