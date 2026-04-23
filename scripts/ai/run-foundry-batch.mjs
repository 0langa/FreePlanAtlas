import fs from "node:fs/promises";
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

function getEnv(name, fallback) {
  return process.env[name] ?? fallback;
}

async function readJsonLines(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function buildUrl(endpoint, deployment, apiVersion) {
  const base = endpoint.replace(/\/$/, "");
  return `${base}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
}

async function callFoundry({ endpoint, apiKey, deployment, apiVersion, prompt }) {
  const url = buildUrl(endpoint, deployment, apiVersion);
  const body = {
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 900,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Foundry call failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry({ retries, backoffMs, ...params }) {
  let attempt = 0;
  while (true) {
    try {
      return await callFoundry(params);
    } catch (err) {
      attempt += 1;
      if (attempt > retries) {
        throw err;
      }
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = args.get("in");
  const outputPath = args.get("out") || path.join(process.cwd(), "ai", "responses.jsonl");

  const endpoint = args.get("endpoint") || getEnv("FOUNDRY_ENDPOINT");
  const apiKey = args.get("apiKey") || getEnv("FOUNDRY_API_KEY");
  const deployment = args.get("deployment") || getEnv("FOUNDRY_DEPLOYMENT");
  const apiVersion = args.get("apiVersion") || getEnv("FOUNDRY_API_VERSION") || "2024-02-15-preview";
  const limit = args.get("limit") ? Number(args.get("limit")) : undefined;
  const retries = args.get("retries") ? Number(args.get("retries")) : 3;
  const backoffMs = args.get("backoffMs") ? Number(args.get("backoffMs")) : 1000;
  const rateLimitMs = args.get("rateLimitMs") ? Number(args.get("rateLimitMs")) : 0;

  if (!inputPath) {
    throw new Error("Missing --in path (requests.jsonl).")
  }
  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Missing Foundry settings. Provide --endpoint, --apiKey, --deployment or set FOUNDRY_ENDPOINT, FOUNDRY_API_KEY, FOUNDRY_DEPLOYMENT.");
  }

  const prompts = await readJsonLines(inputPath);
  const slice = typeof limit === "number" && Number.isFinite(limit) ? prompts.slice(0, limit) : prompts;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  for (const record of slice) {
    const prompt = record.prompt;
    if (!prompt) {
      continue;
    }

    let output = null;
    let rawText = "";
    let error = null;

    try {
      const data = await callWithRetry({ endpoint, apiKey, deployment, apiVersion, prompt, retries, backoffMs });
      rawText = data?.choices?.[0]?.message?.content ?? "";
      output = rawText ? JSON.parse(rawText) : null;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const row = {
      id: record.id,
      name: record.name,
      entry: output,
      raw: output ? undefined : rawText,
      error,
    };

    await fs.appendFile(outputPath, `${JSON.stringify(row)}\n`, "utf8");
    process.stdout.write(".");

    if (rateLimitMs > 0) {
      await sleep(rateLimitMs);
    }
  }

  process.stdout.write("\nDone.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
