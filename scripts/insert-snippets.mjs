import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "articles");

const SNIPPETS = [
  {
    file: "gg-hdmi-cable-recommendation.mdx",
    component: "GGHdmiCableRecommendation",
  },
  {
    file: "gg-streaming-box-recommendation.mdx",
    component: "GGStreamingBoxRecommendation",
  },
  {
    file: "gg-receiver-recommendation.mdx",
    component: "GGReceiverRecommendation",
  },
  {
    file: "gg-soundbar-recommendation.mdx",
    component: "GGSoundbarRecommendation",
  },
  {
    file: "gg-hdmi-switch-recommendation.mdx",
    component: "GGHdmiSwitchRecommendation",
  },
  {
    file: "gg-network-recommendation.mdx",
    component: "GGNetworkRecommendation",
  },
  {
    file: "gg-accessories-recommendation.mdx",
    component: "GGAccessoriesRecommendation",
  },
];

const PRIORITY = [
  "GGHdmiCableRecommendation",
  "GGStreamingBoxRecommendation",
  "GGReceiverRecommendation",
  "GGSoundbarRecommendation",
  "GGHdmiSwitchRecommendation",
  "GGNetworkRecommendation",
  "GGAccessoriesRecommendation",
];

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function parseFrontmatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0].trim() !== "---") {
    return { frontmatter: "", body: raw, meta: {} };
  }

  let second = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      second = i;
      break;
    }
  }
  if (second === -1) {
    return { frontmatter: "", body: raw, meta: {} };
  }

  const frontmatterLines = lines.slice(1, second);
  const bodyLines = lines.slice(second + 1);

  const meta = extractMeta(frontmatterLines);
  return {
    frontmatter: frontmatterLines.join("\n"),
    body: bodyLines.join("\n"),
    meta,
  };
}

function extractMeta(lines) {
  let slug = "";
  let category = "";
  const tags = [];

  let inTags = false;
  for (const line of lines) {
    const slugMatch = line.match(/^\s*slug:\s*"?([^"\n]+)"?\s*$/i);
    if (slugMatch) slug = slugMatch[1].trim();

    const categoryMatch = line.match(/^\s*category:\s*"?([^"\n]+)"?\s*$/i);
    if (categoryMatch) category = categoryMatch[1].trim();

    if (line.match(/^\s*tags:\s*$/i)) {
      inTags = true;
      continue;
    }
    if (inTags) {
      const tagMatch = line.match(/^\s*-\s*["']?([^"'\n]+)["']?\s*$/);
      if (tagMatch) {
        tags.push(tagMatch[1].trim());
        continue;
      } else if (line.trim().length === 0) {
        inTags = false;
      } else if (!line.startsWith(" ")) {
        inTags = false;
      }
    }
  }

  return { slug, category, tags };
}

function chooseSnippets(meta, filename) {
  const slug = (meta.slug || filename).toLowerCase();
  const category = (meta.category || "").toLowerCase();
  const tags = (meta.tags || []).map((t) => t.toLowerCase());

  const matches = new Set();

  const hasCat = (substr) => category.includes(substr);
  const hasTag = (t) => tags.includes(t);
  const hasSlug = (substr) => slug.includes(substr);

  // A) HDMI cable
  if (
    hasCat("hdmi") ||
    hasSlug("hdmi") ||
    hasSlug("no-signal") ||
    hasSlug("black-screen") ||
    hasSlug("handshake") ||
    hasSlug("earc") ||
    hasSlug("arc")
  ) {
    matches.add("GGHdmiCableRecommendation");
  }

  // B) Streaming box
  if (
    hasCat("apple tv") ||
    hasCat("streaming") ||
    hasTag("apps") ||
    hasTag("streaming") ||
    hasTag("tv-apps") ||
    hasSlug("apps") ||
    hasSlug("streaming")
  ) {
    matches.add("GGStreamingBoxRecommendation");
  }

  // C) Receiver / AVR
  if (
    hasCat("receivers & amps") ||
    hasCat("receiver") ||
    hasSlug("receiver") ||
    hasSlug("avr")
  ) {
    matches.add("GGReceiverRecommendation");
  }

  // D) Soundbar
  if (hasCat("soundbar") || hasCat("soundbars") || hasSlug("soundbar")) {
    matches.add("GGSoundbarRecommendation");
  }

  // E) HDMI switch
  if (
    hasCat("gaming & consoles") ||
    hasSlug("4k120") ||
    hasSlug("120hz") ||
    hasSlug("vrr") ||
    hasSlug("hdmi-switch") ||
    hasSlug("switch-4k120")
  ) {
    matches.add("GGHdmiSwitchRecommendation");
  }

  // F) Accessories
  if (
    hasCat("troubleshooting") ||
    hasCat("general") ||
    hasSlug("general-troubleshooting-hub") ||
    hasSlug("setup-basics")
  ) {
    matches.add("GGAccessoriesRecommendation");
  }

  // G) Network
  if (
    hasCat("networking & wi-fi") ||
    hasTag("wifi") ||
    hasTag("networking") ||
    hasTag("buffering") ||
    hasSlug("wifi") ||
    hasSlug("buffering")
  ) {
    matches.add("GGNetworkRecommendation");
  }

  // prioritize and cap at 2
  const ordered = PRIORITY.filter((c) => matches.has(c)).slice(0, 2);
  return ordered;
}

function findImports(body) {
  const lines = body.split(/\r?\n/);
  const imports = [];
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("import ")) {
      imports.push(line);
      lastImportIndex = i;
    } else if (line.trim() === "") {
      continue;
    } else {
      break;
    }
  }
  return { imports, lastImportIndex };
}

function ensureImports(body, components) {
  if (components.length === 0) return { body, addedImports: [] };

  const { imports: existingImports, lastImportIndex } = findImports(body);
  const existingSet = new Set(existingImports);

  const newImportLines = [];
  for (const comp of components) {
    const snippet = SNIPPETS.find((s) => s.component === comp);
    if (!snippet) continue;
    const importLine = `import ${snippet.component} from "../snippets/${snippet.file}";`;
    if (!existingSet.has(importLine)) {
      newImportLines.push(importLine);
    }
  }

  if (newImportLines.length === 0) {
    return { body, addedImports: [] };
  }

  const lines = body.split(/\r?\n/);
  const insertionIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
  const prefix = lines.slice(0, insertionIndex);
  const rest = lines.slice(insertionIndex);

  const newLines = [];
  if (insertionIndex === 0 && prefix.length === 0) {
    // ensure a blank line after imports if no existing imports
    newLines.push(...newImportLines, "", ...rest);
  } else {
    newLines.push(...prefix, ...newImportLines, ...rest);
  }

  return { body: newLines.join("\n"), addedImports: newImportLines };
}

function hasUsage(body, component) {
  const pattern = new RegExp(`<${component}[\\s/>]`);
  return pattern.test(body);
}

function insertComponents(body, components) {
  if (components.length === 0) return { body, addedComponents: [] };

  const snippetsToAdd = components.filter((c) => !hasUsage(body, c));
  if (snippetsToAdd.length === 0) return { body, addedComponents: [] };

  const snippetBlock = snippetsToAdd.map((c) => `<${c} />`).join("\n");

  const youMightLike = /(^|\n)##\s+You might also like.*/i;
  const match = body.match(youMightLike);
  if (match && match.index !== undefined) {
    const insertAt = match.index;
    const before = body.slice(0, insertAt).replace(/\s*$/, "");
    const after = body.slice(insertAt);
    const newBody = `${before}\n\n${snippetBlock}\n\n${after}`.replace(/\n{3,}/g, "\n\n");
    return { body: newBody, addedComponents: snippetsToAdd };
  }

  const trimmed = body.replace(/\s*$/, "");
  const newBody = `${trimmed}\n\n${snippetBlock}\n`;
  return { body: newBody, addedComponents: snippetsToAdd };
}

function processFile(filePath) {
  const raw = readFile(filePath);
  const { frontmatter, body, meta } = parseFrontmatter(raw);
  const filename = path.basename(filePath, ".mdx");
  const chosen = chooseSnippets(meta, filename);

  if (chosen.length === 0) {
    console.log(`Skipped (no snippets): ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const importResult = ensureImports(body, chosen);
  const componentResult = insertComponents(importResult.body, chosen);

  const newBody = componentResult.body;

  if (newBody === body && importResult.addedImports.length === 0) {
    console.log(`Skipped (already had snippets): ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const newContent = ["---", frontmatter, "---", ""].join("\n") + newBody;
  writeFile(filePath, newContent);

  const added = [
    ...importResult.addedImports.map((line) => line.match(/import\s+(\w+)/)?.[1]).filter(Boolean),
    ...componentResult.addedComponents,
  ];
  const uniqAdded = Array.from(new Set(added));

  console.log(
    `Updated: ${path.relative(process.cwd(), filePath)} (added: ${uniqAdded.join(", ")})`,
  );
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`Articles folder not found: ${ROOT}`);
    process.exit(1);
  }

  const files = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mdx")) {
        files.push(full);
      }
    }
  };
  walk(ROOT);

  for (const file of files) {
    try {
      processFile(file);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message || err);
    }
  }
}

main();
