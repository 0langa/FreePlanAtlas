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
- `domain`
- `subtypes` (array)
- `audiences` (array)
- `tags` (array)
- `pricingModel` (`free`, `freemium`, `trial`)
- `freeTierDetails` object
- `useCases` (array)
- `bestFor` (array)
- `avoidIf` (array)
- `difficulty` (`beginner`, `intermediate`, `advanced`)
- `productionReadiness` (`prototype`, `side-project`, `production-light`, `production-ready`)
- `lastUpdated` (ISO date)
- `popularityScore` (number)
- `usefulnessScore` (number)

See `content/services/azure-functions.mdx` as a reference.

## Optional Fields

- `ratingBreakdown`
- `officialUrl`
- `docsUrl`
- `featured`

Additional per-type fields:

- guides: `estimatedTime`, `prerequisites`
- playbooks: `objective`
- comparisons: `comparedProviders`

## Domain and Audience Rules

- `domain` is a controlled vocabulary. Pick the primary decision domain (e.g., `hosting`, `compute`, `database`).
- `subtypes` should be short, consistent labels used for filtering (e.g., `serverless`, `edge-functions`, `object-storage`).
- `audiences` should reflect who benefits most (e.g., `indie`, `startup`, `team`).

## Free Tier Risk Rules

`freeTierDetails` should include:

- `freeTierType` (`always-free`, `time-limited`, `credit`, `trial`)
- `hasHardCap` (true when usage is blocked rather than billed)
- `overageRisk` (none, low, medium, high)
- `billingRiskNotes` for hidden costs or overages

## Workflow

1. Add MDX file in the correct category folder.
2. Run `npm run search:index` to refresh search records.
3. Run `npm run build:static` to validate type-safe build + export.
4. Open `/explorer` locally and confirm entry appears in filters/search.

## Classification Guidance

- `services`: hosted platforms or runtimes developers build on.
- `tools`: products used to build, test, deploy, or operate services.
- `resources`: learning or reference material (not a product or platform).
