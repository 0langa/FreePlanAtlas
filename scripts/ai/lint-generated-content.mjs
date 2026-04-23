import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const DEFAULT_DIR = path.join(process.cwd(), "content", "services");

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
  "Auth0",
  "Authgear",
  "Authress",
  "Twilio",
  "EMQX",
  "Khan Academy",
  "LoginLlama",
  "PropelAuth",
  "SimpleLogin",
  "Stack Auth",
]);

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

async function main() {
  const args = process.argv.slice(2);
  const dirFlagIndex = args.indexOf("--dir");
  const dir = dirFlagIndex >= 0 ? args[dirFlagIndex + 1] : DEFAULT_DIR;

  if (!dir) {
    throw new Error("Missing --dir value.");
  }

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

  if (warnings.length) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning.filePath}: ${warning.issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("OK: no lint warnings");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
