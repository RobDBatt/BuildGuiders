#!/usr/bin/env node
// Convert JSON briefs in content/inbox/*.json → MDX drafts in content/posts/
// Usage: npm run intake [optional: path/to/file.json]

const fs = require("fs");
const path = require("path");

const INBOX_DIR = "content/inbox";
const OUT_DIR = "content/posts";

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function toFrontMatter(obj) {
  const yamlSafe = (v) =>
    String(v).replace(/"/g, '\\"'); // very simple escape for quotes
  const arr = (a) => (Array.isArray(a) ? a : []).map((x) => yamlSafe(x)).join(", ");
  return `---
title: "${yamlSafe(obj.title)}"
description: "${yamlSafe(obj.description || "")}"
date: ${obj.date || today()}
updated: ${obj.updated || today()}
brand: ${obj.brand || ""}
device: ${obj.device || ""}
problem: ${obj.problem || slugify(obj.title)}
tags: [${arr(obj.tags || [obj.brand, obj.device, "Fixes"])}]
draft: ${obj.draft === false ? false : true}
toc: ${obj.toc === false ? false : true}
---
`;
}

function mdxBody(o) {
  const paidLink = o.paidLink || "https://example.com";
  const quick = o.quick || {};
  const steps = Array.isArray(o.steps) ? o.steps : [];
  const why = o.why || "";
  const next = Array.isArray(o.next) ? o.next : [];

  const stepsMd = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const nextMd = next.map((n) => `- ${n}`).join("\n");

  return `
> **Affiliate note:** Some links are **(paid link)**. We don't show prices or ratings; we only link when a product is part of the actual fix.

## Quick Fix Summary
- **If you have 2 minutes:** ${quick.fast || "<add fast fix>"}
- **If you have 10 minutes:** ${quick.deeper || "<add deeper path>"}

## Who this guide is for
${o.audience || "<symptoms + who benefits>"}

## Step-by-step fixes
${stepsMd || "1. <Exact menu path>\n2. <Step>\n3. <Step>"}

## Why this works (short)
${why || "<plain-English reason>"}

## When to replace hardware
Suggest a vetted option: [Certified 48 Gbps HDMI 2.1 cable (paid link)](${paidLink})

## Next steps
${nextMd || "- Related guide A\n- Related guide B"}
`.trimStart();
}

function convertOne(jsonPath) {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const data = JSON.parse(raw);

  if (!data.title || !data.brand || !data.device) {
    throw new Error(`Missing required fields (title, brand, device) in ${jsonPath}`);
  }

  const slug = data.slug || slugify(data.problem || data.title);
  const outPath = path.join(OUT_DIR, `${slug}.mdx`);

  const fm = toFrontMatter(data);
  const body = mdxBody(data);
  const content = `${fm}\n\n${body}\n`;

  ensureDir(OUT_DIR);
  fs.writeFileSync(outPath, content, "utf8");
  // Optionally remove the intake file after conversion
  fs.unlinkSync(jsonPath);

  console.log(`✅ Created draft: ${outPath}`);
}

function run() {
  const arg = process.argv[2];
  ensureDir(INBOX_DIR);
  ensureDir(OUT_DIR);

  if (arg && fs.existsSync(arg)) {
    convertOne(arg);
    return;
  }

  const files = fs.readdirSync(INBOX_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.log("ℹ️  No JSON briefs found in content/inbox");
    return;
  }
  files.forEach((f) => convertOne(path.join(INBOX_DIR, f)));
}
run();
