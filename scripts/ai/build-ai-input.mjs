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

function buildPrompt({ name, url, kind }) {
  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(name);

  return {
    id: slug,
    name,
    url,
    kind,
    prompt: `You are drafting a FreeTierAtlas v2 entry. Output JSON only (no markdown).\n\nRequired: write short, user-oriented decision guidance fields:\n- whenToUse: 1-2 sentences (specific, practical, avoids fluff)\n- whenNotToUse: 1-2 sentences (clear tradeoffs/constraints)\nRequired: write quickstartSteps as 3-6 numbered setup steps.\nRequired: write quickstartSteps as 3-6 numbered setup steps.\n\nConstraints\n- Keep description to one sentence, max 24 words.\n- Use concise lists (3-5 items) for arrays.\n- Use conservative defaults when unsure.\n- Use ISO date \${today} for lastUpdated.\n- Use kebab-case slug derived from name: \${slug}.\n- Prefer provider names: Azure, AWS, Google Cloud, Cloudflare, Oracle Cloud, Supabase, GitHub, Microsoft, IBM, DigitalOcean.\n- Category should be short Title Case (e.g., \"Serverless Compute\", \"Container Registry\"). Avoid hyphenated or lowercase-only labels.\n- If docsUrl is unknown, set to empty string. If you know the official docs, include it.\n- Output must validate schema.\n\nSchema:\n{\n  title: string,\n  description: string,\n  provider: string,\n  category: string,\n  domain: "hosting"|"compute"|"database"|"storage"|"auth"|"messaging"|"observability"|"ai"|"devops"|"security"|"networking"|"productivity"|"learning"|"design"|"analytics"|"integration"|"operations"|"other",\n  subtypes: string[],\n  audiences: ("student"|"indie"|"startup"|"team"|"enterprise"|"oss"|"agency")[],\n  tags: string[],\n  pricingModel: "free"|"freemium"|"trial",\n  freeTierDetails: {\n    summary: string,\n    limits: string[],\n    caveats?: string[],\n    resetPeriod?: string,\n    requiresCard?: boolean,\n    freeTierType?: "always-free"|"time-limited"|"credit"|"trial",\n    hasHardCap?: boolean,\n    overageRisk?: "none"|"low"|"medium"|"high",\n    billingRiskNotes?: string[],\n    trialDays?: number,\n    monthlyCreditAmount?: string\n  },\n  useCases: string[],\n  quickstartSteps: string[],\n  whenToUse: string,\n  whenNotToUse: string,\n  bestFor: string[],\n  avoidIf: string[],\n  difficulty: "beginner"|"intermediate"|"advanced",\n  productionReadiness: "prototype"|"side-project"|"production-light"|"production-ready",\n  lastUpdated: string,\n  popularityScore: number,\n  usefulnessScore: number,\n  officialUrl?: string,\n  docsUrl?: string,\n  sourceUrls?: string[],\n  featured?: boolean,\n  body: string\n}\n\nEntry context:\n- name: ${name}\n- officialUrl: ${url || ""}\n- kind: ${kind}\n\nReturn JSON only.`,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const batchPath = args.get("batch");
  const kind = args.get("kind") || "services";
  const outPath = args.get("out") || path.join(process.cwd(), "ai", "requests.jsonl");

  if (!batchPath) {
    throw new Error("Missing --batch path.");
  }

  const batchText = await fs.readFile(batchPath, "utf8");
  const items = parseBatchLines(batchText);
  const prompts = items.map((item) => buildPrompt({ ...item, kind }));

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, prompts.map((p) => JSON.stringify(p)).join("\n") + "\n", "utf8");

  console.log(`Wrote ${prompts.length} prompt records to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
