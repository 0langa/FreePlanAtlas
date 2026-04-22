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
export type Domain =
  | "hosting"
  | "compute"
  | "database"
  | "storage"
  | "auth"
  | "messaging"
  | "observability"
  | "ai"
  | "devops"
  | "security"
  | "networking"
  | "productivity"
  | "learning"
  | "design"
  | "analytics"
  | "integration"
  | "operations"
  | "other";
export type FreeTierType = "always-free" | "time-limited" | "credit" | "trial";
export type OverageRisk = "none" | "low" | "medium" | "high";
export type ProductionReadiness = "prototype" | "side-project" | "production-light" | "production-ready";
export type Audience = "student" | "indie" | "startup" | "team" | "enterprise" | "oss" | "agency";

export type FreeTierDetails = {
  summary: string;
  limits: string[];
  caveats?: string[];
  resetPeriod?: string;
  requiresCard?: boolean;
  freeTierType?: FreeTierType;
  hasHardCap?: boolean;
  overageRisk?: OverageRisk;
  billingRiskNotes?: string[];
  trialDays?: number;
  monthlyCreditAmount?: string;
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
  domain: Domain;
  subtypes: string[];
  audiences: Audience[];
  tags: string[];
  pricingModel: PricingModel;
  freeTierDetails: FreeTierDetails;
  useCases: string[];
  bestFor: string[];
  avoidIf: string[];
  difficulty: FilterDifficulty;
  productionReadiness: ProductionReadiness;
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
  domain: Domain;
  freeTierType: FreeTierType;
  overageRisk: OverageRisk;
  productionReadiness: ProductionReadiness;
  tags: string[];
  bestFor: string[];
  content: string;
};
