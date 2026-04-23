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

function normalizeTags(values) {
  return values.map((value) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$|^$/g, "")
  ).filter(Boolean);
}

function guessDocsUrl(officialUrl) {
  if (!officialUrl) {
    return undefined;
  }
  try {
    const url = new URL(officialUrl);
    const host = url.hostname;
    const docsHost = `docs.${host.replace(/^www\./, "")}`;
    if (!host.startsWith("docs.")) {
      return `https://${docsHost}`;
    }
    return `${url.origin}/docs`;
  } catch {
    return undefined;
  }
}

function ensureIsoDate(value) {
  const trimmed = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return new Date().toISOString().slice(0, 10);
}

const PROVIDER_NORMALIZATION = [
  { match: /^microsoft azure$/i, value: "Azure" },
  { match: /^azure$/i, value: "Azure" },
  { match: /^amazon web services$/i, value: "AWS" },
  { match: /^aws$/i, value: "AWS" },
  { match: /^google cloud$/i, value: "Google Cloud" },
  { match: /^google$/i, value: "Google Cloud" },
  { match: /^gcp$/i, value: "Google Cloud" },
  { match: /^cloudflare$/i, value: "Cloudflare" },
  { match: /^oracle cloud$/i, value: "Oracle Cloud" },
  { match: /^oracle$/i, value: "Oracle Cloud" },
  { match: /^auth0$/i, value: "Auth0" },
  { match: /^authgear$/i, value: "Authgear" },
  { match: /^authress$/i, value: "Authress" },
  { match: /^twilio$/i, value: "Twilio" },
  { match: /^emqx$/i, value: "EMQX" },
  { match: /^khan academy$/i, value: "Khan Academy" },
  { match: /^loginllama$/i, value: "LoginLlama" },
  { match: /^propelauth$/i, value: "PropelAuth" },
  { match: /^simplelogin$/i, value: "SimpleLogin" },
  { match: /^stack auth$/i, value: "Stack Auth" },
];

function normalizeProvider(value) {
  const trimmed = value.trim();
  for (const rule of PROVIDER_NORMALIZATION) {
    if (rule.match.test(trimmed)) {
      return rule.value;
    }
  }
  return trimmed;
}

function normalizeCategory(value) {
  const cleaned = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return cleaned;
  }
  const words = cleaned.split(" ").map((word) => {
    if (/^[A-Z0-9/]+$/.test(word) && word.length <= 6) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  return words.join(" ").replace(/\bCi\/Cd\b/gi, "CI/CD");
}

function ensureString(value, field) {
  if (!value || typeof value !== "string") {
    throw new Error(`Missing or invalid string field '${field}'.`);
  }
  return value.trim();
}

function ensureStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Missing or invalid string[] field '${field}'.`);
  }
  return value.map((item) => String(item));
}

function ensureNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid number field '${field}'.`);
  }
  return value;
}

function optionalString(value) {
  if (value == null || value === "") return undefined;
  return String(value);
}

function renderFrontmatter(entry) {
  const freeTierDetails = entry.freeTierDetails || {};
  const lines = [
    "---",
    `title: ${JSON.stringify(entry.title)}`,
    `description: ${JSON.stringify(entry.description)}`,
    `provider: ${JSON.stringify(entry.provider)}`,
    `category: ${JSON.stringify(entry.category)}`,
    `domain: ${entry.domain}`,
    "subtypes:",
    ...entry.subtypes.map((item) => `  - ${item}`),
    "audiences:",
    ...entry.audiences.map((item) => `  - ${item}`),
    "tags:",
    ...entry.tags.map((item) => `  - ${item}`),
    `pricingModel: ${entry.pricingModel}`,
    "freeTierDetails:",
    `  summary: ${JSON.stringify(freeTierDetails.summary)}`,
    "  limits:",
    ...freeTierDetails.limits.map((item) => `    - ${item}`),
  ];

  if (freeTierDetails.caveats?.length) {
    lines.push("  caveats:");
    lines.push(...freeTierDetails.caveats.map((item) => `    - ${item}`));
  }
  if (freeTierDetails.resetPeriod) {
    lines.push(`  resetPeriod: ${freeTierDetails.resetPeriod}`);
  }
  if (typeof freeTierDetails.requiresCard === "boolean") {
    lines.push(`  requiresCard: ${freeTierDetails.requiresCard}`);
  }
  if (freeTierDetails.freeTierType) {
    lines.push(`  freeTierType: ${freeTierDetails.freeTierType}`);
  }
  if (typeof freeTierDetails.hasHardCap === "boolean") {
    lines.push(`  hasHardCap: ${freeTierDetails.hasHardCap}`);
  }
  if (freeTierDetails.overageRisk) {
    lines.push(`  overageRisk: ${freeTierDetails.overageRisk}`);
  }
  if (freeTierDetails.billingRiskNotes?.length) {
    lines.push("  billingRiskNotes:");
    lines.push(...freeTierDetails.billingRiskNotes.map((item) => `    - ${item}`));
  }
  if (typeof freeTierDetails.trialDays === "number") {
    lines.push(`  trialDays: ${freeTierDetails.trialDays}`);
  }
  if (freeTierDetails.monthlyCreditAmount) {
    lines.push(`  monthlyCreditAmount: ${JSON.stringify(freeTierDetails.monthlyCreditAmount)}`);
  }

  lines.push("useCases:");
  lines.push(...entry.useCases.map((item) => `  - ${item}`));
  lines.push("quickstartSteps:");
  lines.push(...entry.quickstartSteps.map((item) => `  - ${item}`));
  lines.push(`whenToUse: ${JSON.stringify(entry.whenToUse)}`);
  lines.push(`whenNotToUse: ${JSON.stringify(entry.whenNotToUse)}`);
  lines.push("bestFor:");
  lines.push(...entry.bestFor.map((item) => `  - ${item}`));
  lines.push("avoidIf:");
  lines.push(...entry.avoidIf.map((item) => `  - ${item}`));
  lines.push(`difficulty: ${entry.difficulty}`);
  lines.push(`productionReadiness: ${entry.productionReadiness}`);
  lines.push(`lastUpdated: ${entry.lastUpdated}`);
  lines.push(`popularityScore: ${entry.popularityScore}`);
  lines.push(`usefulnessScore: ${entry.usefulnessScore}`);

  if (entry.ratingBreakdown) {
    lines.push("ratingBreakdown:");
    lines.push(`  onboarding: ${entry.ratingBreakdown.onboarding}`);
    lines.push(`  reliability: ${entry.ratingBreakdown.reliability}`);
    lines.push(`  ecosystem: ${entry.ratingBreakdown.ecosystem}`);
    lines.push(`  valueDensity: ${entry.ratingBreakdown.valueDensity}`);
  }
  if (entry.officialUrl) {
    lines.push(`officialUrl: ${entry.officialUrl}`);
  }
  if (entry.docsUrl) {
    lines.push(`docsUrl: ${entry.docsUrl}`);
  }
  if (entry.sourceUrls?.length) {
    lines.push("sourceUrls:");
    lines.push(...entry.sourceUrls.map((item) => `  - ${item}`));
  }
  if (typeof entry.featured === "boolean") {
    lines.push(`featured: ${entry.featured}`);
  }

  lines.push("---");
  return lines.join("\n");
}

function validateEntry(entry) {
  return {
    title: ensureString(entry.title, "title"),
    description: ensureString(entry.description, "description"),
    provider: normalizeProvider(ensureString(entry.provider, "provider")),
    category: normalizeCategory(ensureString(entry.category, "category")),
    domain: ensureString(entry.domain, "domain"),
    subtypes: ensureStringArray(entry.subtypes, "subtypes"),
    audiences: ensureStringArray(entry.audiences, "audiences"),
    tags: normalizeTags(ensureStringArray(entry.tags, "tags")),
    pricingModel: ensureString(entry.pricingModel, "pricingModel"),
    freeTierDetails: {
      summary: ensureString(entry.freeTierDetails?.summary, "freeTierDetails.summary"),
      limits: ensureStringArray(entry.freeTierDetails?.limits, "freeTierDetails.limits"),
      caveats: entry.freeTierDetails?.caveats?.map((item) => String(item)),
      resetPeriod: optionalString(entry.freeTierDetails?.resetPeriod),
      requiresCard: entry.freeTierDetails?.requiresCard,
      freeTierType: optionalString(entry.freeTierDetails?.freeTierType),
      hasHardCap: entry.freeTierDetails?.hasHardCap,
      overageRisk: optionalString(entry.freeTierDetails?.overageRisk),
      billingRiskNotes: entry.freeTierDetails?.billingRiskNotes?.map((item) => String(item)),
      trialDays: entry.freeTierDetails?.trialDays,
      monthlyCreditAmount: optionalString(entry.freeTierDetails?.monthlyCreditAmount),
    },
    useCases: ensureStringArray(entry.useCases, "useCases"),
    whenToUse: ensureString(entry.whenToUse, "whenToUse"),
    whenNotToUse: ensureString(entry.whenNotToUse, "whenNotToUse"),
    quickstartSteps: Array.isArray(entry.quickstartSteps)
      ? entry.quickstartSteps.map((item) => String(item))
      : [],
    bestFor: ensureStringArray(entry.bestFor, "bestFor"),
    avoidIf: Array.isArray(entry.avoidIf) ? entry.avoidIf.map((item) => String(item)) : [],
    difficulty: ensureString(entry.difficulty, "difficulty"),
    productionReadiness: ensureString(entry.productionReadiness, "productionReadiness"),
    lastUpdated: ensureIsoDate(entry.lastUpdated),
    popularityScore: ensureNumber(entry.popularityScore, "popularityScore"),
    usefulnessScore: ensureNumber(entry.usefulnessScore, "usefulnessScore"),
    ratingBreakdown: entry.ratingBreakdown,
    officialUrl: optionalString(entry.officialUrl),
    docsUrl: optionalString(entry.docsUrl),
    sourceUrls: Array.isArray(entry.sourceUrls) ? entry.sourceUrls.map((item) => String(item)) : undefined,
    featured: typeof entry.featured === "boolean" ? entry.featured : undefined,
    body: optionalString(entry.body) || "",
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = args.get("in");
  const outputDir = args.get("out") || path.join(process.cwd(), "content", args.get("kind") || "services");
  const force = args.get("force") === "true" || args.get("force") === "1";

  if (!inputPath) {
    throw new Error("Missing --in path.");
  }

  const raw = await fs.readFile(inputPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());

  await fs.mkdir(outputDir, { recursive: true });

  for (const line of lines) {
    const parsed = JSON.parse(line);
    const entry = validateEntry(parsed.entry ?? parsed.output ?? parsed.data ?? parsed);
    const slug = slugify(entry.title);
    const filePath = path.join(outputDir, `${slug}.mdx`);
    if (!force) {
      try {
        await fs.access(filePath);
        continue;
      } catch {
        // file does not exist
      }
    }

    if (!entry.docsUrl && entry.officialUrl) {
      entry.docsUrl = guessDocsUrl(entry.officialUrl);
    }
    if (!entry.sourceUrls?.length) {
      entry.sourceUrls = [entry.officialUrl, entry.docsUrl].filter(Boolean);
    }

    const frontmatter = renderFrontmatter(entry);
    const body = entry.body?.trim() ? `\n\n${entry.body.trim()}\n` : "\n";
    const mdx = `${frontmatter}${body}`;
    await fs.writeFile(filePath, mdx, "utf8");
  }

  console.log(`Wrote ${lines.length} MDX files to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
