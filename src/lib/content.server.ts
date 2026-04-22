import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

import type {
  AtlasEntry,
  AtlasEntryWithBody,
  ComparisonEntry,
  ContentKind,
  GuideEntry,
  PlaybookEntry,
  RegistryItem,
} from "@/types/content";
import { CONTENT_KINDS } from "@/types/content";
import { KIND_LABELS } from "@/lib/content";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ALLOWED_EXTENSIONS = new Set([".md", ".mdx"]);

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
    tags: asStringArray(data.tags, "tags"),
    pricingModel: asString(data.pricingModel, "pricingModel") as AtlasEntry["pricingModel"],
    freeTierDetails: {
      summary: asString(freeTierDetailsRaw.summary, "freeTierDetails.summary"),
      limits: asStringArray(freeTierDetailsRaw.limits, "freeTierDetails.limits"),
      caveats: optionalStringArray(freeTierDetailsRaw.caveats),
      resetPeriod: optionalString(freeTierDetailsRaw.resetPeriod),
      requiresCard: asBoolean(freeTierDetailsRaw.requiresCard, "freeTierDetails.requiresCard", false),
    },
    useCases: asStringArray(data.useCases, "useCases"),
    difficulty: asString(data.difficulty, "difficulty") as AtlasEntry["difficulty"],
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
    featured: asBoolean(data.featured, "featured", false),
  };

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
