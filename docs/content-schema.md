# Content Schema (v2)

FreeTierAtlas v2 uses a decision-first frontmatter schema that captures free-tier risk, production suitability, and use-case fit.

## Shared Schema

```ts
{
  title: string;
  description: string;
  provider: string;
  category: string; // legacy display label
  domain: "hosting" | "compute" | "database" | "storage" | "auth" | "messaging" | "observability" | "ai" | "devops" | "security" | "networking" | "productivity" | "learning" | "design" | "analytics" | "integration" | "operations" | "other";
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

Per-type schemas extend the shared fields:

- guides add execution metadata
- playbooks add objective metadata
- comparisons add compared provider sets

This keeps a single search/explorer pipeline while allowing type-specific depth.

## Notes for Migration

- `domain`, `subtypes`, `audiences`, `bestFor`, `avoidIf`, `productionReadiness`, and free-tier risk fields are inferred if missing.
- Legacy `category` remains for display, but `domain` is the canonical filter field in v2.
