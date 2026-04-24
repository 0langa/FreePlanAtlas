import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key?.startsWith("--")) {
      args.set(key.slice(2), value);
      i += 1;
      continue;
    }
    if (!args.has("_pos")) {
      args.set("_pos", []);
    }
    args.get("_pos").push(key);
  }
  return args;
}

function parseBatchList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveKindForBatch(fileName, fallbackKind) {
  const normalized = fileName.toLowerCase();
  if (normalized.startsWith("long-tail-devtools")) {
    return "tools";
  }
  if (normalized.startsWith("long-tail-docs-community")) {
    return "resources";
  }
  if (normalized.startsWith("long-tail-learning")) {
    return "resources";
  }
  if (normalized.startsWith("long-tail-saas")) {
    return "services";
  }
  return fallbackKind;
}

async function listBatchFiles(batchDir) {
  const entries = await fs.promises.readdir(batchDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
      }
    });
  });
}

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv);
  const positional = args.get("_pos") || [];
  const batchDir = args.get("batchDir") || positional[0] || path.join(root, "batch-intake");
  const kind = args.get("kind") || positional[1] || "services";
  const force = args.get("force") === "true" || args.get("force") === "1";
  const skipFoundry = args.get("skipFoundry") === "true" || args.get("skipFoundry") === "1";
  const reportsDir = path.join(root, "reports");
  const batchFiles = parseBatchList(args.get("batchFiles"));
  const limit = args.get("limit") ? Number(args.get("limit")) : undefined;

  let lastContentDir = null;

  let batches = batchFiles;
  if (!batches.length) {
    batches = await listBatchFiles(batchDir);
  }
  if (typeof limit === "number" && Number.isFinite(limit)) {
    batches = batches.slice(0, limit);
  }

  if (!batches.length) {
    throw new Error(`No batch files found in ${batchDir}`);
  }

  for (const batchFile of batches) {
    const batchPath = path.isAbsolute(batchFile) ? batchFile : path.join(batchDir, batchFile);
    const batchBase = path.parse(batchPath).name;
    const batchKind = resolveKindForBatch(path.basename(batchPath), kind);
    const contentDir = path.join(root, "content", batchKind);
    lastContentDir = contentDir;
    const inputPath = path.join(batchDir, `${batchBase}.requests.jsonl`);
    const outputPath = path.join(batchDir, `${batchBase}.responses.jsonl`);
    const timestamp = nowStamp();
    const reportArgs = [
      "scripts/ai/report-batch.mjs",
      "--responses",
      outputPath,
      "--contentDir",
      contentDir,
      "--outDir",
      reportsDir,
      "--label",
      `ai-batch-${batchBase}`,
      "--timestamp",
      timestamp,
    ];

    let failure = null;

    try {
      if (!skipFoundry) {
        await run("node", ["scripts/ai/build-ai-input.mjs", "--batch", batchPath, "--out", inputPath, "--kind", batchKind], { cwd: root });
        await run("node", ["scripts/ai/run-foundry-batch.mjs", "--in", inputPath, "--out", outputPath], { cwd: root });
      } else if (!fs.existsSync(outputPath)) {
        throw new Error(`Missing responses file at ${outputPath}. Run Foundry or disable --skipFoundry.`);
      }
      const applyArgs = ["scripts/ai/apply-ai-output.mjs", "--in", outputPath, "--out", contentDir, "--kind", batchKind];
      if (force) {
        applyArgs.push("--force", "true");
      }
      await run("node", applyArgs, { cwd: root });
      await run("node", ["scripts/ai/normalize-content.mjs", contentDir], { cwd: root });
      await run("node", ["scripts/ai/lint-generated-content.mjs", "--dir", contentDir], { cwd: root });
    } catch (error) {
      failure = error;
    } finally {
      try {
        await run("node", reportArgs, { cwd: root });
      } catch (reportError) {
        console.error(reportError);
      }
    }

    if (failure) {
      throw failure;
    }
  }

  const trackingArgs = [
    "scripts/ai/track-batches.mjs",
    "--batchDir",
    batchDir,
    "--contentDir",
    lastContentDir ?? path.join(root, "content", kind),
    "--outDir",
    reportsDir,
  ];
  await run("node", trackingArgs, { cwd: root });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});