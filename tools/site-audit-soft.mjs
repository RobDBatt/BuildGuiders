// tools/site-audit-soft.mjs
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const TASKS = [
  { label: "validate-content", cmd: "node", args: ["scripts/validate-content.mjs"] },
  { label: "check-amazon-tags", cmd: "node", args: ["scripts/check-amazon-tags.mjs"] },
  { label: "validate-product-catalog", cmd: "node", args: ["tools/validate-product-catalog.mjs"] },
  { label: "report-amazon-links", cmd: "node", args: ["tools/report-amazon-links.mjs"] },
  { label: "scan-catalog-usage", cmd: "node", args: ["tools/scan-catalog-usage.mjs"] },
];

function runTool(label, command, args) {
  console.log(`=== Running: ${label} ===`);
  const result = spawnSync(command, args, { stdio: "inherit", cwd: ROOT, env: process.env });
  const commandText = [command, ...args].join(" ");
  if (result.status !== 0) {
    console.log(
      `[WARN] ${label} exited with code ${result.status} (command: "${commandText}"). This is informational and does not block deployment.`,
    );
    return false;
  }
  console.log(`[OK] ${label} completed successfully (command: "${commandText}")`);
  return true;
}

function main() {
  let hadIssues = false;
  for (const task of TASKS) {
    const ok = runTool(task.label, task.cmd, task.args);
    if (!ok) hadIssues = true;
    console.log("");
  }

  if (hadIssues) {
    console.log("Soft audit complete. Some tools reported warnings or errors; see output above.");
  } else {
    console.log("Soft audit complete. All tools reported success.");
  }

  process.exit(0);
}

main();

// Usage:
//   node tools/site-audit-soft.mjs
// or via npm:
//   npm run audit:soft
