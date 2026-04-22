# Architecture (v2)

FreeTierAtlas v2 is a static, decision-first catalog for free-tier services, tools, and guidance. It keeps the current Next.js export pipeline but upgrades the data model, filters, and search to expose free-tier risk, quota shape, and production readiness.

## Goals

- Make free-tier decisions comparable across providers and categories.
- Surface billing risk and quota shape before users get surprises.
- Preserve a static publishing pipeline with zero runtime dependencies.
- Scale to thousands of entries without taxonomy drift.

## Information Architecture

Content kinds remain:

- services
- tools
- resources
- guides
- playbooks
- comparisons

Core decision metadata is normalized across kinds with:

- `domain` (primary filter)
- `subtypes` (secondary filters)
- `audiences`
- `freeTierType`, `overageRisk`, and `productionReadiness`
- `bestFor` and `avoidIf`

## Content Pipeline

1. Author MDX with frontmatter under `content/{kind}`.
2. Build-time loader parses frontmatter and normalizes missing v2 fields.
3. Registries are generated for filtering (domain, provider, risk, etc.).
4. Search index is generated into `src/generated/search-index.json`.
5. Next.js static export produces the final site.

## Data Flow

- `src/lib/content.server.ts` walks `content/`, validates/normalizes entries, and returns:
  - entries
  - registries
  - featured slices
  - content lookup by path
- `scripts/build-search-index.mjs` builds search records from the same content tree.
- `src/components/layout/global-search.tsx` loads the JSON index client-side with FlexSearch.

## Explorer Model

Filters are driven by registries generated at build time:

- kind, domain, provider, tag
- free-tier type
- overage risk
- production readiness
- requires card
- difficulty

Sorting modes prioritize decision context:

- best overall
- lowest billing risk
- easiest to start
- best no-card option
- production-light suitability

## Content Pages

Each entry page shows structured decision data above the MDX body:

- best for
- avoid if
- free tier snapshot
- quota limits
- billing risk notes

## Compatibility

The loader accepts legacy frontmatter and infers v2 fields to keep existing content working during migration.

## Build and Verification

- `npm run typecheck`
- `npm run search:index`
- `npm run build`

## Related Docs

- [content-schema.md](./content-schema.md)
- [adding-content.md](./adding-content.md)
- [project_progress.md](./project_progress.md)
