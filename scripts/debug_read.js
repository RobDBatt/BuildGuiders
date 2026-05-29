const fs = require("fs");
console.log("Debug: Starting");
const filePath = process.argv[2];
console.log("Debug: Path is", filePath);
try {
    const text = fs.readFileSync(filePath, "utf8");
    console.log("Debug: Read success, length", text.length);
} catch (e) {
    console.log("Debug: Read failed", e.message);
}
