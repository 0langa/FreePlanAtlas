# Content Schema (v2)

FreeTierWiki uses a decision-first frontmatter schema that captures free-tier risk, production suitability, and use-case fit.

## Shared Schema

```ts
{
  title: string;
  description: string;
  provider: string;
  category: string; // category is aligned to domain values
  domain: "hosting" | "compute" | "database" | "storage" | "auth" | "messaging" | "observability" | "ai" | "devops" | "security" | "networking" | "productivity" | "learning" | "design" | "analytics" | "integration" | "operations" | "other"; // internal category key
  subtypes: string[]; // normalized product/service subtypes
  audiences: ("student" | "indie" | "startup" | "team" | "enterprise" | "oss" | "agency")[];
  tags: string[];
  pricingModel: "free" | "freemium" | "trial";
  freeTierDetails: {
    summary: string;
    limits: string[];
    caveats?: string[];
    resetPeriod?: string;
    requiresCard?: boolean;
    freeTierType?: "always-free" | "time-limited" | "credit" | "trial";
    hasHardCap?: boolean;
    overageRisk?: "none" | "low" | "medium" | "high";
    billingRiskNotes?: string[];
    trialDays?: number;
    monthlyCreditAmount?: string;
  };
  useCases: string[];
  whenToUse: string;
  whenNotToUse: string;
  quickstartSteps: string[];
  bestFor: string[];
  avoidIf: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  productionReadiness: "prototype" | "side-project" | "production-light" | "production-ready";
  lastUpdated: string; // ISO date, e.g. "2026-04-22"
  popularityScore: number;
  usefulnessScore: number;
  ratingBreakdown?: {
    onboarding: number;
    reliability: number;
    ecosystem: number;
    valueDensity: number;
  };
  officialUrl?: string;
  docsUrl?: string;
  sourceUrls?: string[];
  featured?: boolean;
}
```

## Computed Fields

The build-time loader computes:

- `slug`
- `kind`
- `url`

These power routing, navigation, and explorer tables without manual wiring.

## Extensibility

Per-type schemas extend the shared fields as needed. Currently only services/tools/resources are active.

## Notes for Migration

- `domain` (category key), `subtypes`, `audiences`, `bestFor`, `avoidIf`, `productionReadiness`, and free-tier risk fields are inferred if missing.
- `category` is now aligned to `domain` values and used for display.
