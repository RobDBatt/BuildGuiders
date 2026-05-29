import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "affiliate-products.json");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const OUT_FILE = path.join(ARTICLES_DIR, "quick-fix-accessories-hub.mdx");

const DISCLAIMER_LINE = "*(paid link)*";
const FRONTMATTER_NOTE = "Paid link: BuildGuiders may earn a commission at no extra cost to you.";

(async () => {
    const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
    const items = catalog.items || [];
    const today = new Date().toISOString().split("T")[0];

    const productsFrontmatter = items.map(item => ({
        name: item.name,
        description: item.description,
        url: item.url,
        note: FRONTMATTER_NOTE
    }));

    const mdxContent = `
## Quick Fix Accessories Hub

Before replacing your TV or receiver, try these industry-standard accessories. Most AV problems (no signal, buffering, audio dropouts) are caused by cabling or network issues, not broken hardware.

**Disclosure**: As an Amazon Associate I earn from qualifying purchases.

## When to buy vs when to troubleshoot

- **Buy a new cable if:** You see "No Signal", black screens, or flickering only on specific sources (like PS5 or Apple TV).
- **Buy a mesh system if:** Your Wi-Fi buffers in specific rooms but is fast near the router.
- **Buy a surge protector if:** Your devices randomly reboot or rebooting fixes them temporarily.

## The 8 Approved Accessories

${items.map(item => `
### ${item.name}

**Best for:** ${item.intent.toUpperCase()} issues.

- **Why it helps:** ${item.description}
- **Use case:** ${item.match.slice(0, 3).join(", ")}
- **Link:** [${item.name} (paid link)](${item.url})
`).join("\n")}

## Quick picks by symptom

| Symptom | Recommended Fix |
| :--- | :--- |
| **No Signal / Black Screen** | [Zeskit Maya 8K HDMI Cable (paid link)](${items.find(i => i.key === "hdmi_21_short")?.url}) |
| **Wi-Fi Buffering** | [TP-Link Deco Mesh System (paid link)](${items.find(i => i.key === "mesh_wifi_system")?.url}) |
| **Audio Dropouts (eARC)** | [Zeskit Maya 8K HDMI Cable (paid link)](${items.find(i => i.key === "hdmi_21_short")?.url}) |
| **Remote Dead** | [Panasonic Eneloop Pro Batteries (paid link)](${items.find(i => i.key === "rechargeable_batteries")?.url}) |
| **Random Reboots** | [Belkin Surge Protector (paid link)](${items.find(i => i.key === "power_strip_surge")?.url}) |

## Related Fixes

- [HDMI No Signal Fixes](/articles/hdmi-no-signal-step-by-step)
- [eARC Audio Issues](/articles/arc-earc-no-sound-quick-fixes)
- [Wi-Fi Buffering Guide](/articles/streaming-buffering-wifi-networking-fixes)
`;

    const frontmatter = {
        title: "Quick Fix Accessories Hub",
        slug: "quick-fix-accessories-hub",
        date: today,
        brand: "General",
        category: "General",
        tags: ["accessories", "troubleshooting", "quick-fix"],
        description: "A curated list of approved accessories to fix common AV problems like HDMI no signal, buffering, and power issues.",
        keywords: "hdmi cable, mesh wifi, surge protector, screen cleaner, troubleshooting accessories",
        published: true,
        products: productsFrontmatter
    };

    const fileContent = matter.stringify(mdxContent, frontmatter);

    await fs.writeFile(OUT_FILE, fileContent, "utf8");
    console.log(`✅ Generated ${OUT_FILE}`);

})().catch(err => {
    console.error(err);
    process.exit(1);
});
