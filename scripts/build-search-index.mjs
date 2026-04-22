import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const OUTPUT_PATH = path.join(process.cwd(), "src", "generated", "search-index.json");

const ALLOWED_EXTENSIONS = new Set([".md", ".mdx"]);

function stripMarkdown(source) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/^#+\s+/gm, "")
    .replace(/[>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferDomain(category = "", tags = []) {
  const haystack = `${category} ${tags.join(" ")}`.toLowerCase();
  if (/host|deploy|static/.test(haystack)) return "hosting";
  if (/serverless|function|compute|container|kubernetes/.test(haystack)) return "compute";
  if (/database|postgres|mysql|sql|mongo|redis|vector/.test(haystack)) return "database";
  if (/storage|blob|object|file|bucket/.test(haystack)) return "storage";
  if (/auth|identity|oauth|login|access/.test(haystack)) return "auth";
  if (/queue|message|pubsub|realtime|event|websocket/.test(haystack)) return "messaging";
  if (/monitor|observability|logging|telemetry|apm|uptime|error/.test(haystack)) return "observability";
  if (/ai|ml|llm|speech|vision|search|embedding/.test(haystack)) return "ai";
  if (/ci|cd|devops|pipeline|automation|build/.test(haystack)) return "devops";
  if (/security|vault|scan|compliance/.test(haystack)) return "security";
  if (/network|dns|cdn|vpn|gateway|load balancer/.test(haystack)) return "networking";
  if (/course|academy|learn|education|tutorial/.test(haystack)) return "learning";
  return "other";
}

function inferFreeTierType(pricingModel = "free") {
  return pricingModel === "trial" ? "trial" : "always-free";
}

async function* walkFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

async function buildSearchRecords() {
  const records = [];

  for await (const filePath of walkFiles(CONTENT_DIR)) {
    const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
    const [kind, ...slugParts] = relativePath.split("/");
    const slug = slugParts.join("/").replace(/\.(md|mdx)$/i, "");
    const file = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(file);
    const tags = Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [];
    const category = String(data.category ?? "");
    const freeTierDetails = data.freeTierDetails && typeof data.freeTierDetails === "object" ? data.freeTierDetails : {};

    records.push({
      id: `${kind}:${slug}`,
      url: `/${kind}/${slug}`,
      slug,
      kind,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      provider: String(data.provider ?? "Unknown"),
      domain: String(data.domain ?? inferDomain(category, tags)),
      freeTierType: String(freeTierDetails.freeTierType ?? inferFreeTierType(data.pricingModel)),
      overageRisk: String(freeTierDetails.overageRisk ?? (freeTierDetails.hasHardCap ? "none" : "low")),
      productionReadiness: String(data.productionReadiness ?? "prototype"),
      tags,
      bestFor: Array.isArray(data.bestFor)
        ? data.bestFor.map((item) => String(item))
        : Array.isArray(data.useCases)
          ? data.useCases.map((item) => String(item))
          : [],
      content: stripMarkdown(`${content} ${category} ${(Array.isArray(data.useCases) ? data.useCases.join(" ") : "")}`),
    });
  }

  records.sort((a, b) => a.title.localeCompare(b.title));

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  console.log(`Search index written to ${OUTPUT_PATH} (${records.length} records).`);
}

buildSearchRecords().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});