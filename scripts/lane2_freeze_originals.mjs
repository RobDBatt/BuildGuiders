import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const TARGETS_PATH = path.join(REPO_ROOT, "reports", "lane2_targets_20.json");

function stamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
        d.getHours()
    )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function main() {
    if (!fs.existsSync(TARGETS_PATH)) {
        console.error(`Targets file not found: ${TARGETS_PATH}`);
        process.exit(1);
    }

    const raw = fs.readFileSync(TARGETS_PATH, "utf8");
    const parsed = JSON.parse(raw);

    const picked = Array.isArray(parsed?.picked) ? parsed.picked : [];
    if (!picked.length) {
        console.error(`No picked targets found in ${TARGETS_PATH}`);
        process.exit(1);
    }

    const ts = stamp();
    const snapRoot = path.join(REPO_ROOT, ".retrofit-snapshots", ts);
    const originalsDir = path.join(snapRoot, "originals");
    fs.mkdirSync(originalsDir, { recursive: true });

    let copied = 0;

    for (const item of picked) {
        const slug = item.slug;
        if (!slug) continue;

        const mdxPath = item.mdxPath
            ? path.resolve(item.mdxPath)
            : path.join(REPO_ROOT, "content", "gadget-guiders", `${slug}.mdx`);

        if (!fs.existsSync(mdxPath)) {
            console.warn(`Skipping (missing): ${slug} -> ${mdxPath}`);
            continue;
        }

        const dest = path.join(originalsDir, `${slug}.mdx`);
        fs.copyFileSync(mdxPath, dest);
        copied++;
    }

    fs.mkdirSync(path.join(REPO_ROOT, ".retrofit-snapshots"), { recursive: true });
    fs.writeFileSync(
        path.join(REPO_ROOT, ".retrofit-snapshots", "LATEST.txt"),
        snapRoot,
        "utf8"
    );

    console.log(`Snapshot complete. Copied ${copied} file(s).`);
    console.log(`Saved originals: ${originalsDir}`);
    console.log(`LATEST pointer: .retrofit-snapshots/LATEST.txt`);
}

main();
