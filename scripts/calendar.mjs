import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function main() {
    console.log('--- Content Calendar Audit ---\n');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        process.exit(1);
    }

    const allFiles = getFiles(ARTICLES_DIR);
    const mdxFiles = allFiles.filter(f => f.endsWith('.mdx'));

    const schedule = {}; // date -> count
    let futureCount = 0;
    let totalArticles = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const file of mdxFiles) {
        let content;
        try {
            content = fs.readFileSync(file, 'utf8');
        } catch { continue; }

        let parsed;
        try {
            parsed = matter(content);
        } catch { continue; }

        const date = parsed.data.date;
        if (date) {
            if (!schedule[date]) schedule[date] = 0;
            schedule[date]++;

            if (date > today) futureCount++;
            totalArticles++;
        }
    }

    // Sort dates
    const sortedDates = Object.keys(schedule).sort();

    // Display only future dates or recent past
    console.log(`📅 Publishing Schedule (Next 30 Days):\n`);

    let displayed = 0;
    for (const date of sortedDates) {
        if (date >= today) {
            const count = schedule[date];
            const bar = '█'.repeat(count);
            console.log(`${date}: ${bar} (${count} articles)`);
            displayed++;
            if (displayed > 30) break; // limit to next month visual
        }
    }

    console.log('\n-----------------------------------');
    console.log(`Total Articles: ${totalArticles}`);
    console.log(`Future Scheduled: ${futureCount}`);
    console.log(`Coverage until: ${sortedDates[sortedDates.length - 1]}`);
}

main().catch(console.error);
