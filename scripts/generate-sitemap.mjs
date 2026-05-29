import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL = 'https://buildguiders-20.com';

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
    console.log('--- Generating Sitemap ---');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    console.log(`Scanning ${mdxFiles.length} MDX files...`);

    let urls = [];

    // Add static pages
    urls.push({
        loc: `${BASE_URL}/`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0'
    });

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
            continue;
        }

        const slug = parsed.data.slug;
        const date = parsed.data.date;

        if (slug) {
            urls.push({
                loc: `${BASE_URL}/posts/${slug}`,
                lastmod: date || new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: '0.8'
            });
        }
    }

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const outputPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap, 'utf8');

    console.log('---------------------------------------------------');
    console.log(`Sitemap Generated: public/sitemap.xml`);
    console.log(`Total URLs: ${urls.length}`);
}

main().catch(console.error);
