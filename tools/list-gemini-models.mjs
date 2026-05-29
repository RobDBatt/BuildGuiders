import "dotenv/config";
import process from "node:process";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

(async () => {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`Error ${res.status}: ${await res.text()}`);
            return;
        }
        const data = await res.json();
        console.log("Available Models:");
        if (data.models) {
            for (const m of data.models) {
                console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods?.join(", ")})`);
            }
        } else {
            console.log("No models returned.");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
})();
