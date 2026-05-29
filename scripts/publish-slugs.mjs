import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

const slugs = process.argv.slice(2);

if (slugs.length === 0) {
    console.log("Usage: node scripts/publish-slugs.mjs <slug1> <slug2> ...");
    process.exit(0);
}

(async () => {
    let updated = 0;
    for (const slug of slugs) {
        const filename = slug.endsWith(".mdx") ? slug : `${slug}.mdx`;
        const filePath = path.join(ARTICLES_DIR, filename);

        try {
            const raw = await fs.readFile(filePath, "utf8");
            const parsed = matter(raw);

            if (parsed.data.published === true) {
                console.log(`ℹ️  Already published: ${slug}`);
                continue;
            }

            parsed.data.published = true;
            const newContent = matter.stringify(parsed.content, parsed.data);

            await fs.writeFile(filePath, newContent, "utf8");
            console.log(`✅ Published: ${slug}`);
            updated++;
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error(`❌ File not found: ${filename}`);
            } else {
                console.error(`❌ Error processing ${slug}:`, err.message);
            }
        }
    }

    console.log(`\nDone. Published ${updated} articles.`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
