
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

async function deleteUnpublished() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        return;
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('published: false')) {
                fs.unlinkSync(filePath);
                console.log(`Deleted: ${file}`);
                deletedCount++;
            }
        } catch (err) {
            console.error(`Failed to delete ${file}:`, err.message);
            errorCount++;
        }
    }

    console.log(`\nSummary: Deleted ${deletedCount} files.`);
    if (errorCount > 0) console.log(`Failed to delete ${errorCount} files (likely locked).`);
}

deleteUnpublished();
