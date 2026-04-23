# Adding Content

Add new entries by creating an `.mdx` file under one of these folders:

- `content/services`
- `content/tools`
- `content/resources`
- `content/guides`
- `content/playbooks`
- `content/comparisons`

## Required Frontmatter Fields

Every entry requires these fields:

- `title`
- `description`
- `provider`
- `category`
- `tags` (array)
- `pricingModel` (`free`, `freemium`, `trial`)
- `freeTierDetails.summary`
- `freeTierDetails.limits`
- `useCases` (array)
- `whenToUse`
- `whenNotToUse`
- `quickstartSteps` (array)
- `difficulty` (`beginner`, `intermediate`, `advanced`)
- `lastUpdated` (ISO date)
- `popularityScore` (number)
- `usefulnessScore` (number)

See `content/services/azure-functions.mdx` as a reference.

## Optional Fields

- `ratingBreakdown`
- `officialUrl`
- `docsUrl`
- `sourceUrls`
- `featured`

Additional per-type fields:

- guides: `estimatedTime`, `prerequisites`
- playbooks: `objective`
- comparisons: `comparedProviders`

## Domain and Audience Rules

- `domain` is a controlled vocabulary. Pick the primary decision domain (e.g., `hosting`, `compute`, `database`). If omitted, it is inferred from `category` + `tags`.
- `subtypes` should be short, consistent labels used for filtering (e.g., `serverless`, `edge-functions`, `object-storage`). If omitted, it falls back to `category`.
- `audiences` should reflect who benefits most (e.g., `indie`, `startup`, `team`). If omitted, defaults to `indie` + `startup`.

## Free Tier Risk Rules

`freeTierDetails` can include:

- `freeTierType` (`always-free`, `time-limited`, `credit`, `trial`) - inferred from `pricingModel` when omitted
- `hasHardCap` (true when usage is blocked rather than billed)
- `overageRisk` (none, low, medium, high) - defaults to `none` when `hasHardCap` is true, otherwise `low`
- `billingRiskNotes` for hidden costs or overages

## Workflow

1. Add MDX file in the correct category folder.
2. Run `npm run search:index` to refresh search records.
3. Run `npm run build:static` to validate type-safe build + export.
4. Open `/explorer` locally and confirm entry appears in filters/search.

## AI Batch Ingestion

For automated batch entry generation (with required `whenToUse` / `whenNotToUse` guidance), use:

- [docs/ai-ingestion.md](docs/ai-ingestion.md)

## Classification Guidance

- `services`: hosted platforms or runtimes developers build on.
- `tools`: products used to build, test, deploy, or operate services.
- `resources`: learning or reference material (not a product or platform).
