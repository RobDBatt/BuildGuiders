import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.argv[2] || ".");
const exts = new Set([".mdx"]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (["node_modules", ".git", ".next", "dist", "build"].includes(ent.name)) continue;
      walk(p, out);
    } else if (ent.isFile()) {
      if (exts.has(path.extname(ent.name).toLowerCase())) out.push(p);
    }
  }
  return out;
}

function looksLikeGearGuiders(filePath, content) {
  const hay = (filePath + "\n" + content).toLowerCase();
  const gearTerms = [
    "gearguiders",
    "steam deck",
    "nintendo switch",
    "handheld",
    "portable",
    "earbuds",
    "phone",
    "tablet",
    "laptop",
    "mobile gaming",
    "rog ally",
    "legion go",
    "backbone",
    "joy-con",
  ];
  return gearTerms.some((t) => hay.includes(t));
}

const files = walk(ROOT);
const candidates = [];

for (const f of files) {
  let content = "";
  try {
    content = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }

  const haystack = content.toLowerCase();
  const isGGHint = f.toLowerCase().includes("buildguiders") || haystack.includes("buildguiders");
  if (!isGGHint) continue;

  if (looksLikeGearGuiders(f, content)) continue;

  candidates.push(f);
}

console.log(candidates.join("\n"));
console.error(`\nFound ${candidates.length} BuildGuiders candidates (skipping GearGuiders-like).`);
