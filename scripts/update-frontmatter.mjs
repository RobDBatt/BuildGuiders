import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust recursion root if necessary. Assuming content/articles relative to scripts/
const ARTICLES_DIR = path.join(__dirname, '../content/articles');

function getFiles(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(function (file) {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(getFiles(file));
            } else {
                /* Is a file */
                results.push(file);
            }
        });
    } catch (e) {
        console.warn(`Skipping search in ${dir}: ${e.message}`);
    }
    return results;
}

function getPlaceholderProducts(category) {
    const c = String(category || '').toLowerCase();

    if (c.includes('hdmi')) {
        return [
            {
                name: "Certified Ultra High Speed HDMI Cable",
                url: "https://www.amazon.com/s?k=certified+ultra+high+speed+hdmi+cable",
                note: "Fixes black screen and handshake issues."
            }
        ];
    }
    if (c.includes('mount') || c.includes('stand')) {
        return [
            {
                name: "Universal TV Mount",
                url: "https://www.amazon.com/s?k=tv+mount",
                note: "Ensure VESA compatibility."
            }
        ];
    }
    if (c.includes('soundbar') || c.includes('audio')) {
        return [
            {
                name: "eARC Soundbar",
                url: "https://www.amazon.com/s?k=earc+soundbar",
                note: "Required for uncompressed Dolby Atmos."
            }
        ];
    }
    if (c.includes('oled') || c.includes('tv')) {
        return [
            {
                name: "Microfiber Screen Cleaner",
                url: "https://www.amazon.com/s?k=screen+cleaner",
                note: "Don't use Windex on OLED screens."
            }
        ];
    }

    // Generic fallback
    return [
        {
            name: "TODO: Product Name",
            url: "https://www.amazon.com/s?k=TODO",
            note: "TODO: Note"
        }
    ];
}

async function main() {
    console.log('--- Starting Backfill of "products" Frontmatter ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Found ${mdxFiles.length} MDX files.`);

    let updatedCount = 0;

    for (const file of mdxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = matter(content);

        // Check if 'products' key exists
        if (!parsed.data.products) {
            console.log(`Updating: ${path.basename(file)}`);

            const newProducts = getPlaceholderProducts(parsed.data.category);
            parsed.data.products = newProducts;

            // gray-matter stringify re-builds the file with frontmatter + content
            const newFileContent = matter.stringify(parsed.content, parsed.data);

            fs.writeFileSync(file, newFileContent);
            updatedCount++;
        }
    }

    console.log('---------------------------------------------------');
    console.log(`Completed. Updated ${updatedCount} files.`);
}

main().catch(console.error);
