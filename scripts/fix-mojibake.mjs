
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Map of Mojibake string -> Correct character
const REPLACEMENTS = new Map([
    ['ΓÇö', '—'], // Em Dash
    ['ΓÇª', '…'], // Ellipsis
    ['ΓÇ£', '“'], // Left Double Quote
    ['ΓÇ¥', '”'], // Right Double Quote
    ['ΓÇÖ', '’'], // Right Single Quote / Apostrophe
    ['ΓÇÿ', '‘'], // Left Single Quote / sometimes simplified to ' or - depending on context?
    // But typically '‘'.
    ['╦£', '“'],  // Seen in view_file output, likely Left Double Quote
    ['ΓÇô', '–'], // En Dash (hypothesized)
]);

async function fixMojibake() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        return;
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
    let totalFixed = 0;

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        for (const [bad, good] of REPLACEMENTS) {
            // Global replace all instances
            // We escape the bad string to ensure regex safety just in case, though these specific chars are mostly safe
            const regex = new RegExp(bad, 'g');
            newContent = newContent.replace(regex, good);
        }

        if (newContent !== content) {
            console.log(`Fixing mojibake in: ${file}`);
            fs.writeFileSync(filePath, newContent, 'utf8');
            totalFixed++;
        }
    }

    console.log(`\nFixed ${totalFixed} files.`);
}

fixMojibake();
