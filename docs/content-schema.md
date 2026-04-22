# Content Schema

FreeTierAtlas uses a unified frontmatter schema for MDX content, validated at build time.

## Shared Schema

```ts
{
  title: string;
  description: string;
  provider: string;
  category: string;
  tags: string[];
  pricingModel: "free" | "freemium" | "trial";
  freeTierDetails: {
    summary: string;
    limits: string[];
    caveats?: string[];
    resetPeriod?: string;
    requiresCard?: boolean;
  };
  useCases: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
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
