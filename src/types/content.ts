export const CONTENT_KINDS = [
  "services",
  "tools",
  "resources",
  "guides",
  "playbooks",
  "comparisons",
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

export type PricingModel = "free" | "freemium" | "trial";
export type FilterDifficulty = "beginner" | "intermediate" | "advanced";

export type FreeTierDetails = {
  summary: string;
  limits: string[];
  caveats?: string[];
  resetPeriod?: string;
  requiresCard?: boolean;
};

export type RatingBreakdown = {
  onboarding: number;
  reliability: number;
  ecosystem: number;
  valueDensity: number;
};

export type AtlasEntryBase = {
  id: string;
  kind: ContentKind;
  slug: string;
  url: string;

  title: string;
  description: string;
  provider: string;
  category: string;
  tags: string[];
  pricingModel: PricingModel;
  freeTierDetails: FreeTierDetails;
  useCases: string[];
  difficulty: FilterDifficulty;
  lastUpdated: string;
  popularityScore: number;
  usefulnessScore: number;

  ratingBreakdown?: RatingBreakdown;
  officialUrl?: string;
  docsUrl?: string;
  featured?: boolean;
};

export type ServiceEntry = AtlasEntryBase & { kind: "services" };
export type ToolEntry = AtlasEntryBase & { kind: "tools" };
export type ResourceEntry = AtlasEntryBase & { kind: "resources" };
export type GuideEntry = AtlasEntryBase & {
  kind: "guides";
  estimatedTime?: string;
  prerequisites?: string[];
};
export type PlaybookEntry = AtlasEntryBase & { kind: "playbooks"; objective: string };
export type ComparisonEntry = AtlasEntryBase & {
  kind: "comparisons";
  comparedProviders: string[];
};

export type AtlasEntry =
  | ServiceEntry
  | ToolEntry
  | ResourceEntry
  | GuideEntry
  | PlaybookEntry
  | ComparisonEntry;

export type AtlasEntryWithBody = AtlasEntry & {
  body: {
    raw: string;
  };
};

export type RegistryItem = {
  value: string;
  count: number;
};

export type SearchRecord = {
  id: string;
  url: string;
  slug: string;
  kind: ContentKind;
  title: string;
  description: string;
  provider: string;
  tags: string[];
  content: string;
};
