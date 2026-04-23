import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ALLOWED_PROVIDERS = new Set([
  "Azure",
  "AWS",
  "Google Cloud",
  "Cloudflare",
  "Oracle Cloud",
  "Supabase",
  "GitHub",
  "Microsoft",
  "IBM",
  "DigitalOcean",
]);

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

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function readJsonLines(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function* walkFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (fullPath.endsWith(".mdx") || fullPath.endsWith(".md")) {
      yield fullPath;
    }
  }
}

function isLowercase(value) {
  return value === value.toLowerCase();
}

async function collectLintWarnings(dir) {
  const warnings = [];
  for await (const filePath of walkFiles(dir)) {
    const raw = await fs.readFile(filePath, "utf8");
    const { data } = matter(raw);
    const provider = String(data.provider ?? "").trim();
    const category = String(data.category ?? "").trim();
    const officialUrl = String(data.officialUrl ?? "").trim();
    const docsUrl = String(data.docsUrl ?? "").trim();
    const quickstartSteps = Array.isArray(data.quickstartSteps) ? data.quickstartSteps : [];

    if (provider && !ALLOWED_PROVIDERS.has(provider)) {
      warnings.push({ filePath, issue: `provider '${provider}' not in allowed list` });
    }

    if (category) {
      if (category.includes("-") || category.includes("_")) {
        warnings.push({ filePath, issue: `category '${category}' contains hyphen/underscore` });
      }
      if (isLowercase(category)) {
        warnings.push({ filePath, issue: `category '${category}' is lowercase` });
      }
    }

    if (officialUrl && !docsUrl) {
      warnings.push({ filePath, issue: "missing docsUrl" });
    }

    if (docsUrl && !/^https?:\/\//i.test(docsUrl)) {
      warnings.push({ filePath, issue: `docsUrl '${docsUrl}' is not a valid URL` });
    }

    if (quickstartSteps.length === 0) {
      warnings.push({ filePath, issue: "missing quickstartSteps" });
    } else if (quickstartSteps.length < 3) {
      warnings.push({ filePath, issue: "quickstartSteps has fewer than 3 steps" });
    }
  }
  return warnings;
}

async function main() {
  const args = parseArgs(process.argv);
  const responsesPath = args.get("responses");
  const contentDir = args.get("contentDir");
  const outDir = args.get("outDir") || path.join(process.cwd(), "reports");
  const timestampValue = args.get("timestamp");
  const timestamp = timestampValue ? new Date(timestampValue) : new Date();
  const runLabel = args.get("label") || "ai-batch";

  const report = {
    label: runLabel,
    timestamp: timestamp.toISOString(),
    foundry: { total: 0, errors: [] },
    lint: { total: 0, warnings: [] },
  };

  if (responsesPath) {
    try {
      const rows = await readJsonLines(responsesPath);
      report.foundry.total = rows.length;
      report.foundry.errors = rows
        .filter((row) => row?.error || !row?.entry)
        .map((row) => ({
          id: row?.id ?? "",
          name: row?.name ?? "",
          error: row?.error ?? "Missing entry",
        }));
    } catch (error) {
      report.foundry.errors.push({ id: "", name: "", error: `Failed to read responses: ${error.message}` });
    }
  }

  if (contentDir) {
    try {
      report.lint.warnings = await collectLintWarnings(contentDir);
      report.lint.total = report.lint.warnings.length;
    } catch (error) {
      report.lint.warnings.push({ filePath: contentDir, issue: `Failed to lint: ${error.message}` });
      report.lint.total = report.lint.warnings.length;
    }
  }

  await fs.mkdir(outDir, { recursive: true });
  const stamp = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, "0")}${String(timestamp.getDate()).padStart(2, "0")}-${String(timestamp.getHours()).padStart(2, "0")}${String(timestamp.getMinutes()).padStart(2, "0")}${String(timestamp.getSeconds()).padStart(2, "0")}`;
  const jsonPath = path.join(outDir, `${runLabel}-${stamp}.json`);
  const mdPath = path.join(outDir, `${runLabel}-${stamp}.md`);

  const mdLines = [
    `# AI Batch Report`,
    ``,
    `Run: ${runLabel}`,
    `Timestamp: ${formatTimestamp(timestamp)}`,
    ``,
    `## Summary`,
    `- Foundry responses: ${report.foundry.total}`,
    `- Foundry errors: ${report.foundry.errors.length}`,
    `- Lint warnings: ${report.lint.total}`,
    ``,
  ];

  if (report.foundry.errors.length) {
    mdLines.push(`## Foundry Errors`);
    for (const item of report.foundry.errors) {
      const label = [item.id, item.name].filter(Boolean).join(" | ") || "(unknown)";
      mdLines.push(`- ${label}: ${item.error}`);
    }
    mdLines.push("");
  }

  if (report.lint.warnings.length) {
    mdLines.push(`## Lint Warnings`);
    for (const warning of report.lint.warnings) {
      mdLines.push(`- ${warning.filePath}: ${warning.issue}`);
    }
    mdLines.push("");
  }

  if (!report.foundry.errors.length && !report.lint.warnings.length) {
    mdLines.push("No issues detected.");
    mdLines.push("");
  }

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, mdLines.join("\n"), "utf8");

  console.log(`Report: ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
