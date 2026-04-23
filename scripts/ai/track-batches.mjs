import { promises as fs } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key?.startsWith("--")) {
      args.set(key.slice(2), value);
      i += 1;
    }
  }
  return args;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseBatchLines(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => {
      const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!match) {
        const name = line.replace(/^\s*-\s*/, "").trim();
        return { name, url: "" };
      }
      return { name: match[1].trim(), url: match[2].trim() };
    });
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function listBatchFiles(batchDir) {
  const entries = await fs.readdir(batchDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const args = parseArgs(process.argv);
  const batchDir = args.get("batchDir") || path.join(process.cwd(), "batch-intake");
  const contentDir = args.get("contentDir") || path.join(process.cwd(), "content", "services");
  const outDir = args.get("outDir") || path.join(process.cwd(), "reports");
  const timestamp = new Date();

  const batchFiles = await listBatchFiles(batchDir);
  const batches = [];
  const totals = { total: 0, added: 0, missing: 0 };

  for (const fileName of batchFiles) {
    const batchPath = path.join(batchDir, fileName);
    const raw = await fs.readFile(batchPath, "utf8");
    const items = parseBatchLines(raw);
    const added = [];
    const missing = [];

    for (const item of items) {
      const slug = slugify(item.name);
      const entryPath = path.join(contentDir, `${slug}.mdx`);
      try {
        await fs.access(entryPath);
        added.push({ name: item.name, slug, path: entryPath });
      } catch {
        missing.push({ name: item.name, slug });
      }
    }

    totals.total += items.length;
    totals.added += added.length;
    totals.missing += missing.length;

    batches.push({
      batch: fileName,
      total: items.length,
      added,
      missing,
    });
  }

  const report = {
    timestamp: timestamp.toISOString(),
    batchDir,
    contentDir,
    totals,
    batches,
  };

  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "batch-tracking.json");
  const mdPath = path.join(outDir, "batch-tracking.md");

  const mdLines = [
    "# Batch Tracking",
    "",
    `Timestamp: ${formatTimestamp(timestamp)}`,
    "",
    "## Totals",
    `- Total entries: ${totals.total}`,
    `- Added: ${totals.added}`,
    `- Missing: ${totals.missing}`,
    "",
  ];

  for (const batch of batches) {
    mdLines.push(`## ${batch.batch}`);
    mdLines.push(`- Total: ${batch.total}`);
    mdLines.push(`- Added: ${batch.added.length}`);
    mdLines.push(`- Missing: ${batch.missing.length}`);
    if (batch.missing.length) {
      mdLines.push("- Missing entries:");
      for (const item of batch.missing) {
        mdLines.push(`  - ${item.name} (${item.slug})`);
      }
    }
    mdLines.push("");
  }

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, mdLines.join("\n"), "utf8");

  console.log(`Tracking report: ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
