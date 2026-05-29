const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components", "content", "lib", "scripts"];
const EXTS  = new Set([".ts",".tsx",".js",".cjs",".md",".mdx",".json"]);

// Skip heavy/binary + AI intake + old backups
const SKIP_DIRS = new Set(["node_modules",".next",".git","public",".vercel"]);
const SKIP_PATH_PREFIXES = [
  path.join("content","inbox") + path.sep,       // AI briefs
  path.join("content","articles.bak-"),          // backups
  path.join("content","articles.clean-"),
  path.join("content","articles.fixdup-")
];

function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes:true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    e.isDirectory() ? walk(full, out) : out.push(full);
  }
  return out;
}
function shouldFix(p) {
  const rel = path.relative(process.cwd(), p);
  const ext = path.extname(rel);
  if (!EXTS.has(ext)) return false;
  if (SKIP_PATH_PREFIXES.some(pre => rel.startsWith(pre))) return false;
  return true;
}
function hasBom(buf) {
  return buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

function normalizeText(text) {
  // normalize EOLs
  text = text.replace(/\r\n?/g, "\n");

  // replace curly quotes, dashes, ellipsis, nbspaces, zero-width, bidi, soft hyphen
  text = text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, " ")
    .replace(/\u00AD/g, "")
    .replace(/[\u200B\u200C\u200D\u2060]/g, "")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "");

  // final guard: drop any remaining non-ASCII invisibles (keep standard UTF8 letters)
  // (We'll be conservative and only drop C0/C1 control chars)
  text = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "");

  return text;
}

const candidates = ROOTS
  .filter(r => fs.existsSync(r))
  .flatMap(r => walk(r))
  .filter(p => shouldFix(p));

let changed = 0;
for (const file of candidates) {
  const buf = fs.readFileSync(file);
  const hadBom = hasBom(buf);
  let text = buf.toString("utf8");
  if (hadBom) text = text.slice(1); // drop BOM char

  const before = text;
  text = normalizeText(text);
  if (text !== before || hadBom) {
    fs.writeFileSync(file, text, { encoding:"utf8" }); // UTF-8 no BOM
    console.log("fixed", file.replace(/\\/g,"/"));
    changed++;
  }
}

if (changed === 0) {
  console.log("No mojibake found.");
} else {
  console.log(`Normalized ${changed} file(s).`);
}
