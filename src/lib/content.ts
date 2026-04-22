import type {
  Audience,
  ContentKind,
  Domain,
  FreeTierType,
  OverageRisk,
  ProductionReadiness,
} from "@/types/content";

export const KIND_LABELS: Record<ContentKind, string> = {
  services: "Services",
  tools: "Tools",
  resources: "Resources",
  guides: "Guides",
  playbooks: "Playbooks",
  comparisons: "Comparisons",
};

export const PRICING_MODEL_LABELS = {
  free: "Free",
  freemium: "Freemium",
  trial: "Trial",
} as const;

export const DOMAIN_LABELS: Record<Domain, string> = {
  hosting: "Hosting",
  compute: "Compute",
  database: "Database",
  storage: "Storage",
  auth: "Auth",
  messaging: "Messaging",
  observability: "Observability",
  ai: "AI",
  devops: "DevOps",
  security: "Security",
  networking: "Networking",
  productivity: "Productivity",
  learning: "Learning",
  design: "Design",
  analytics: "Analytics",
  integration: "Integration",
  operations: "Operations",
  other: "Other",
};

export const FREE_TIER_TYPE_LABELS: Record<FreeTierType, string> = {
  "always-free": "Always free",
  "time-limited": "Time-limited",
  credit: "Credit-based",
  trial: "Trial",
};

export const OVERAGE_RISK_LABELS: Record<OverageRisk, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRODUCTION_READINESS_LABELS: Record<ProductionReadiness, string> = {
  prototype: "Prototype",
  "side-project": "Side project",
  "production-light": "Production light",
  "production-ready": "Production ready",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  student: "Student",
  indie: "Indie",
  startup: "Startup",
  team: "Team",
  enterprise: "Enterprise",
  oss: "Open source",
  agency: "Agency",
};

export function isContentKind(value: string): value is ContentKind {
  return ["services", "tools", "resources", "guides", "playbooks", "comparisons"].includes(value);
}
