import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.resolve(__dirname, '../content');

/**
 * Recursively find all MDX files in a directory, ignoring directories or files
 * starting with separate segments that begin with underscore.
 */
function findMdxFiles(dir) {
    let results = [];

    // If dir doesn't exist, just return empty to be safe
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);

    for (const file of list) {
        // Ignore segments starting with underscore (like _backups, _legacy-backups)
        if (file.startsWith('_')) {
            continue;
        }

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(findMdxFiles(filePath));
        } else if (file.endsWith('.mdx')) {
            results.push(filePath);
        }
    }

    return results;
}

/**
 * Extracts the slug from the frontmatter of a file content string.
 */
function extractSlug(content) {
    // Regex looks for "slug:" at start of line, allowing for optional quotes
    const match = content.match(/^slug:\s*['"]?([^'"\s\r\n]+)['"]?\s*$/m);
    return match ? match[1] : null;
}

function main() {
    console.log(`Scanning for duplicate slugs in: ${contentDir}`);

    const files = findMdxFiles(contentDir);
    const slugMap = new Map(); // slug -> string[] (array of file paths)
    let scanCount = 0;

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const slug = extractSlug(content);

            if (slug) {
                scanCount++;
                const current = slugMap.get(slug) || [];
                current.push(file);
                slugMap.set(slug, current);
            }
        } catch (err) {
            console.warn(`Warning: Could not read file ${file}:`, err.message);
        }
    }

    console.log(`Scanned ${scanCount} files with valid slugs.`);

    const duplicates = [];
    for (const [slug, filePaths] of slugMap.entries()) {
        if (filePaths.length > 1) {
            duplicates.push({ slug, paths: filePaths });
        }
    }

    if (duplicates.length > 0) {
        console.error(`\n❌ Found ${duplicates.length} duplicate slug(s):\n`);

        duplicates.forEach((dupe) => {
            console.error(`Slug: "${dupe.slug}"`);
            dupe.paths.forEach(p => {
                // Print relative path for readability
                console.error(`  - ${path.relative(path.resolve(__dirname, '..'), p)}`);
            });
            console.error(''); // Empty line separator
        });

        console.error('Process failed due to duplicate slugs.');
        process.exit(1);
    } else {
        console.log('\n✅ No duplicate slugs found.');
        process.exit(0);
    }
}

main();
