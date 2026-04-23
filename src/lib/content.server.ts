import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

import type {
  Audience,
  AtlasEntry,
  AtlasEntryWithBody,
  ComparisonEntry,
  ContentKind,
  Domain,
  FreeTierType,
  GuideEntry,
  OverageRisk,
  PlaybookEntry,
  ProductionReadiness,
  RegistryItem,
} from "@/types/content";
import { CONTENT_KINDS } from "@/types/content";
import { KIND_LABELS } from "@/lib/content";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ALLOWED_EXTENSIONS = new Set([".md", ".mdx"]);

function normalizeBulletPrefix(value: string): string {
  return value.replace(/^\s*[•●▪◦\-–—]\s*/, "").trim();
}

function asString(value: unknown, field: string): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (value == null) {
    throw new Error(`Missing required field '${field}'.`);
  }
  throw new Error(`Invalid '${field}': expected string.`);
}

function asStringArray(value: unknown, field: string): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (value == null) {
    throw new Error(`Missing required field '${field}'.`);
  }
  throw new Error(`Invalid '${field}': expected string[].`);
}

function asNumber(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (value == null) {
    throw new Error(`Missing required field '${field}'.`);
  }
  throw new Error(`Invalid '${field}': expected number.`);
}

function asBoolean(value: unknown, field: string, defaultValue = false): boolean {
  if (value == null) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`Invalid '${field}': expected boolean.`);
}

function optionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  return String(value);
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error("Invalid optional list: expected string[].");
  }
  return value.map((item) => String(item));
}

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  throw new Error("Invalid optional number.");
}

function optionalLiteral<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const normalized = String(value) as T;
  if (!allowed.includes(normalized)) {
    throw new Error(`Invalid optional literal: expected one of ${allowed.join(", ")}.`);
  }
  return normalized;
}

function optionalLiteralArray<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error("Invalid optional literal list.");
  }
  return value.map((item) => {
    const normalized = String(item) as T;
    if (!allowed.includes(normalized)) {
      throw new Error(`Invalid optional literal list item '${normalized}'.`);
    }
    return normalized;
  });
}

const DOMAIN_VALUES = [
  "hosting",
  "compute",
  "database",
  "storage",
  "auth",
  "messaging",
  "observability",
  "ai",
  "devops",
  "security",
  "networking",
  "productivity",
  "learning",
  "design",
  "analytics",
  "integration",
  "operations",
  "other",
] as const satisfies readonly Domain[];

const FREE_TIER_TYPE_VALUES = ["always-free", "time-limited", "credit", "trial"] as const satisfies readonly FreeTierType[];
const OVERAGE_RISK_VALUES = ["none", "low", "medium", "high"] as const satisfies readonly OverageRisk[];
const PRODUCTION_READINESS_VALUES = ["prototype", "side-project", "production-light", "production-ready"] as const satisfies readonly ProductionReadiness[];
const AUDIENCE_VALUES = ["student", "indie", "startup", "team", "enterprise", "oss", "agency"] as const satisfies readonly Audience[];

function inferDomain(category: string, tags: string[]): Domain {
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

function inferFreeTierType(pricingModel: AtlasEntry["pricingModel"]): FreeTierType {
  if (pricingModel === "trial") {
    return "trial";
  }
  return "always-free";
}

function inferProductionReadiness(kind: ContentKind, difficulty: AtlasEntry["difficulty"]): ProductionReadiness {
  if (kind === "resources") return "prototype";
  if (difficulty === "advanced") return "production-light";
  if (difficulty === "intermediate") return "side-project";
  return "prototype";
}

async function* walkFiles(rootDir: string): AsyncGenerator<string> {
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

function deriveKindAndSlug(filePath: string): { kind: ContentKind; slug: string } {
  const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  const [kindRaw, ...slugParts] = relativePath.split("/");
  if (!CONTENT_KINDS.includes(kindRaw as ContentKind)) {
    throw new Error(`Unsupported content kind '${kindRaw}' for file ${relativePath}.`);
  }
  const slug = slugParts.join("/").replace(/\.(md|mdx)$/i, "");
  return { kind: kindRaw as ContentKind, slug };
}

function parseEntry(
  filePath: string,
  rawSource: string,
): { entry: AtlasEntry; bodyRaw: string } {
  const { kind, slug } = deriveKindAndSlug(filePath);
  const { data, content } = matter(rawSource);
  const url = `/${kind}/${slug}`;

  const freeTierDetailsRaw = data.freeTierDetails as Record<string, unknown> | undefined;
  if (!freeTierDetailsRaw || typeof freeTierDetailsRaw !== "object") {
    throw new Error(`Missing required field 'freeTierDetails' in ${url}.`);
  }

  const base: Omit<AtlasEntry, "kind"> & { kind: ContentKind } = {
    id: `${kind}:${slug}`,
    kind,
    slug,
    url,

    title: asString(data.title, "title"),
    description: asString(data.description, "description"),
    provider: asString(data.provider, "provider"),
    category: asString(data.category, "category"),
    domain: optionalLiteral(data.domain, DOMAIN_VALUES) ?? inferDomain(asString(data.category, "category"), asStringArray(data.tags, "tags")),
    subtypes: optionalStringArray(data.subtypes) ?? [asString(data.category, "category")],
    audiences: optionalLiteralArray(data.audiences, AUDIENCE_VALUES) ?? ["indie", "startup"],
    tags: asStringArray(data.tags, "tags"),
    pricingModel: asString(data.pricingModel, "pricingModel") as AtlasEntry["pricingModel"],
    freeTierDetails: {
      summary: asString(freeTierDetailsRaw.summary, "freeTierDetails.summary"),
      limits: asStringArray(freeTierDetailsRaw.limits, "freeTierDetails.limits").map(normalizeBulletPrefix),
      caveats: optionalStringArray(freeTierDetailsRaw.caveats)?.map(normalizeBulletPrefix),
      resetPeriod: optionalString(freeTierDetailsRaw.resetPeriod),
      requiresCard: asBoolean(freeTierDetailsRaw.requiresCard, "freeTierDetails.requiresCard", false),
      freeTierType: optionalLiteral(freeTierDetailsRaw.freeTierType, FREE_TIER_TYPE_VALUES),
      hasHardCap: asBoolean(freeTierDetailsRaw.hasHardCap, "freeTierDetails.hasHardCap", false),
      overageRisk: optionalLiteral(freeTierDetailsRaw.overageRisk, OVERAGE_RISK_VALUES),
      billingRiskNotes: optionalStringArray(freeTierDetailsRaw.billingRiskNotes)?.map(normalizeBulletPrefix),
      trialDays: optionalNumber(freeTierDetailsRaw.trialDays),
      monthlyCreditAmount: optionalString(freeTierDetailsRaw.monthlyCreditAmount),
    },
    useCases: asStringArray(data.useCases, "useCases"),
    whenToUse: asString((data as any).whenToUse, "whenToUse"),
    whenNotToUse: asString((data as any).whenNotToUse, "whenNotToUse"),
    quickstartSteps: optionalStringArray((data as any).quickstartSteps) ?? [],
    bestFor: optionalStringArray(data.bestFor) ?? asStringArray(data.useCases, "useCases"),
    avoidIf: optionalStringArray(data.avoidIf) ?? [],
    difficulty: asString(data.difficulty, "difficulty") as AtlasEntry["difficulty"],
    productionReadiness:
      optionalLiteral(data.productionReadiness, PRODUCTION_READINESS_VALUES) ??
      inferProductionReadiness(kind, asString(data.difficulty, "difficulty") as AtlasEntry["difficulty"]),
    lastUpdated: asString(data.lastUpdated, "lastUpdated"),
    popularityScore: asNumber(data.popularityScore, "popularityScore"),
    usefulnessScore: asNumber(data.usefulnessScore, "usefulnessScore"),

    ratingBreakdown:
      data.ratingBreakdown && typeof data.ratingBreakdown === "object"
        ? {
            onboarding: asNumber((data.ratingBreakdown as any).onboarding, "ratingBreakdown.onboarding"),
            reliability: asNumber((data.ratingBreakdown as any).reliability, "ratingBreakdown.reliability"),
            ecosystem: asNumber((data.ratingBreakdown as any).ecosystem, "ratingBreakdown.ecosystem"),
            valueDensity: asNumber((data.ratingBreakdown as any).valueDensity, "ratingBreakdown.valueDensity"),
          }
        : undefined,
    officialUrl: optionalString(data.officialUrl),
    docsUrl: optionalString(data.docsUrl),
    sourceUrls: optionalStringArray((data as any).sourceUrls),
    featured: asBoolean(data.featured, "featured", false),
  };

  base.freeTierDetails.freeTierType ??= inferFreeTierType(base.pricingModel);
  base.freeTierDetails.overageRisk ??= base.freeTierDetails.hasHardCap ? "none" : "low";

  if (kind === "guides") {
    const guide: GuideEntry = {
      ...base,
      kind: "guides",
      estimatedTime: optionalString((data as any).estimatedTime),
      prerequisites: optionalStringArray((data as any).prerequisites),
    };
    return { entry: guide, bodyRaw: content };
  }

  if (kind === "playbooks") {
    const objective = asString((data as any).objective, "objective");
    const playbook: PlaybookEntry = {
      ...base,
      kind: "playbooks",
      objective,
    };
    return { entry: playbook, bodyRaw: content };
  }

  if (kind === "comparisons") {
    const comparedProviders = asStringArray((data as any).comparedProviders, "comparedProviders");
    const comparison: ComparisonEntry = {
      ...base,
      kind: "comparisons",
      comparedProviders,
    };
    return { entry: comparison, bodyRaw: content };
  }

  return { entry: base as AtlasEntry, bodyRaw: content };
}

export const getContentData = cache(async () => {
  const entries: AtlasEntry[] = [];
  const bodyById = new Map<string, string>();

  for await (const filePath of walkFiles(CONTENT_DIR)) {
    const raw = await fs.readFile(filePath, "utf8");
    const { entry, bodyRaw } = parseEntry(filePath, raw);
    entries.push(entry);
    bodyById.set(entry.id, bodyRaw);
  }

  entries.sort((a, b) => {
    if (b.usefulnessScore !== a.usefulnessScore) {
      return b.usefulnessScore - a.usefulnessScore;
    }
    if (b.popularityScore !== a.popularityScore) {
      return b.popularityScore - a.popularityScore;
    }
    return a.title.localeCompare(b.title);
  });

  function buildRegistry(values: string[]): RegistryItem[] {
    const counts = new Map<string, number>();
    for (const value of values) {
      const key = value.trim();
      if (!key) {
        continue;
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.value.localeCompare(b.value);
      });
  }

  const featuredEntries = entries.filter((entry) => entry.featured).slice(0, 6);
  const providerRegistry = buildRegistry(entries.map((entry) => entry.provider));
  const categoryRegistry = buildRegistry(entries.map((entry) => entry.category));
  const domainRegistry = buildRegistry(entries.map((entry) => entry.domain));
  const freeTierTypeRegistry = buildRegistry(entries.map((entry) => entry.freeTierDetails.freeTierType ?? "always-free"));
  const overageRiskRegistry = buildRegistry(entries.map((entry) => entry.freeTierDetails.overageRisk ?? "low"));
  const productionReadinessRegistry = buildRegistry(entries.map((entry) => entry.productionReadiness));
  const audienceRegistry = buildRegistry(entries.flatMap((entry) => entry.audiences));
  const subtypeRegistry = buildRegistry(entries.flatMap((entry) => entry.subtypes));
  const tagRegistry = buildRegistry(entries.flatMap((entry) => entry.tags));

  const navTypeItems = CONTENT_KINDS.map((value) => ({
    value,
    label: KIND_LABELS[value],
    count: entries.filter((entry) => entry.kind === value).length,
  }));

  const entryByPath = new Map<string, AtlasEntry>();
  for (const entry of entries) {
    entryByPath.set(`${entry.kind}/${entry.slug}`, entry);
  }

  return {
    allEntries: entries,
    featuredEntries,
    providerRegistry,
    categoryRegistry,
    domainRegistry,
    freeTierTypeRegistry,
    overageRiskRegistry,
    productionReadinessRegistry,
    audienceRegistry,
    subtypeRegistry,
    tagRegistry,
    navTypeItems,
    entryByPath,
    bodyById,
  };
});

export const getAllEntries = cache(async (): Promise<AtlasEntry[]> => {
  const data = await getContentData();
  return data.allEntries;
});

export const getEntryByPath = cache(
  async (kind: ContentKind, slug: string): Promise<AtlasEntry | undefined> => {
    const data = await getContentData();
    return data.entryByPath.get(`${kind}/${slug}`);
  },
);

export const getEntryWithBodyByPath = cache(
  async (kind: ContentKind, slug: string): Promise<AtlasEntryWithBody | undefined> => {
    const data = await getContentData();
    const entry = data.entryByPath.get(`${kind}/${slug}`);
    if (!entry) {
      return undefined;
    }
    const body = data.bodyById.get(entry.id);
    if (body == null) {
      return undefined;
    }
    return { ...entry, body: { raw: body } };
  },
);
