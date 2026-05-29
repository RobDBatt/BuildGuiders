
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTICLES_DIR = path.join(__dirname, '../content/articles');

// Map of BROKEN_LINK -> NEW_LINK (or "UNLINK")
const REPLACEMENTS = new Map([
    // Apple TV
    ['/apple-tv-4k-hdmi-no-signal-or-black-screen', '/apple-tv-no-signal-hdmi-black-screen'],
    ['/hdmi-handshake-failures-4k-hdr', '/general-hdmi-no-signal-handshake-troubleshooting-guide'],

    // Audio / Soundbars
    ['/samsung-soundbar-earc-no-sound-or-cutouts', '/soundbar-no-sound-or-cuts-out'],
    ['/lg-soundbar-earc-no-sound', '/lg-c3-soundbar-earc-no-sound-cutouts-fixes'],
    ['/lg-soundbar-hdmi-arc-earc-no-sound', '/lg-c3-soundbar-earc-no-sound-cutouts-fixes'], // Fix stragglers
    ['/sony-bravia-audio-delay-lip-sync-on-arc-earc-settings-that-fix-it', '/audio-delay-on-tv-lip-sync-fixes'],

    // Denon / Receivers
    ['/common-denon-receiver-issues', '/categories/receivers-amps'],
    ['/home-theater-setup', '/categories/receivers-amps'],
    ['/optimize-audio-settings', 'UNLINK'],

    // PS5
    ['/update-ps5-software', 'UNLINK'],
    ['/initialize-ps5', 'UNLINK'],
    ['/optimize-ps5-storage', 'UNLINK'],
    ['/ps5-no-sound-issue', '/ps5-not-making-sound'],
    ['/ps5-hdr-not-working', '/ps5-wont-output-4k-hdr-fix'],
    ['/ps5-screen-flickering', '/ps5-fix-hdmi'],
    ['/hdmi-connection-issues', '/ps5-fix-hdmi'],
    ['/ps5-not-turning-on', '/why-is-my-ps5-not-turning-on'],
    ['/controller-issues', '/ps5-fix-controller-drift'],
    ['/optimize-ps5-performance', 'UNLINK'],
    ['/common-ps5-error-codes', '/ps5-error-codes-list'],
    ['/console-maintenance', 'UNLINK'],

    // Samsung
    ['/improving-wifi-signal-strength', '/why-is-my-samsung-tv-not-connecting-to-wifi'],
    ['/troubleshoot-xbox-connectivity-issues', '/troubleshooting'],
    ['/optimize-samsung-tv-settings', 'UNLINK'],

    // General / Streaming
    ['/streaming-box-hdmi-no-signal-black-screen-checklist', '/general-hdmi-no-signal-handshake-troubleshooting-guide'],
    ['/nvidia-shield-4k-hdr-dolby-atmos-not-working', '/nvidia-shield-no-dolby-atmos-over-hdmi'],

    // TCL
    ['/optimize-sound-settings-tcl-roku-tv', 'UNLINK'],
    ['/troubleshoot-hdmi-connection', '/hdmi-no-signal-step-by-step'],
    ['/improve-streaming-quality-tcl-roku-tv', 'UNLINK'],
]);

async function fixLinks() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Directory not found: ${ARTICLES_DIR}`);
        return;
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
    let totalFixed = 0;

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let modified = false;

        // Use regex to safely replace markdown links: [text](href)
        const linkRegex = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;

        content = content.replace(linkRegex, (match, text, href) => {
            // Strip potential anchor/query for lookup, but we usually want to replace the whole thing if the base is wrong.
            const baseHref = href.split(/[?#]/)[0];

            if (REPLACEMENTS.has(baseHref)) {
                const replacement = REPLACEMENTS.get(baseHref);

                if (replacement === 'UNLINK') {
                    modified = true;
                    return text; // Return just the text, removing the link wrapper
                } else {
                    modified = true;
                    return `[${text}](${replacement})`;
                }
            }
            return match;
        });

        if (modified) {
            console.log(`Fixing links in: ${file}`);
            fs.writeFileSync(filePath, content, 'utf8');
            totalFixed++;
        }
    }

    console.log(`\nFixed links in ${totalFixed} files.`);
}

fixLinks();
