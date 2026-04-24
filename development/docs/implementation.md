# FreeTierWiki Implementation Guide

## 1) Tech Stack

## 1.1 Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 3
- shadcn/ui
- Zustand (client state)
- TanStack Table (Explorer grid)
- FlexSearch (client-side full-text search)
- next-mdx-remote + gray-matter (content rendering/parsing)

## 1.2 Backend (Current)

- No mandatory runtime API service
- Build-time content pipeline implemented in Node scripts and server-side loaders

## 1.3 Data Storage

- MDX files in repository (`content/**`)
- Generated search index JSON (`src/generated/search-index.json`)

## 1.4 Deployment

- Static export (`out/`)
- Cloudflare Pages / GitHub Pages compatible

---

## 2) Project Structure

```text
FreeTierWiki/
  content/
    services/
    tools/
    resources/
  src/
    app/
      page.tsx
      explorer/page.tsx
      [kind]/[...slug]/page.tsx
    components/
      content/
      explorer/
      layout/
      ui/
    lib/
      content.ts
      content.server.ts
      utils.ts
    store/
      explorer-store.ts
    types/
      content.ts
    generated/
      search-index.json
  scripts/
    build-search-index.mjs
    validate-content.mjs
    normalize-tags.mjs
  development/
    scripts/
      ai/
        ...batch ingestion scripts
    docs/
    ai/
    batch-intake/
    reports/
```

---

## 3) Key Components and Responsibilities

| Component | Responsibility |
|---|---|
| `src/lib/content.server.ts` | Load, validate, normalize, and aggregate content registries |
| `src/lib/content.ts` | Label maps and content-kind helpers |
| `src/types/content.ts` | Canonical domain types (`AtlasEntry`, filters, enums) |
| `src/components/layout/global-search.tsx` | Client global search UX + FlexSearch querying |
| `src/components/explorer/explorer-table.tsx` | Filtering, sorting, and table rendering |
| `src/components/content/content-page.tsx` | Detail page composition and metadata display |
| `scripts/build-search-index.mjs` | Build-time search record generation |
| `scripts/validate-content.mjs` | Content schema validation |

---

## 4) Data Model

## 4.1 Entry Shape (Conceptual)

Every entry includes:

- Identity: `id`, `kind`, `slug`, `url`
- Discoverability: `title`, `description`, `provider`, `domain`, `tags`
- Decision guidance: `whenToUse`, `whenNotToUse`, `bestFor`, `avoidIf`
- Free-tier specifics: `pricingModel`, `freeTierDetails.*`
- Operational fit: `difficulty`, `productionReadiness`
- Quality signals: `popularityScore`, `usefulnessScore`

## 4.2 Example Frontmatter (Simplified)

```yaml
---
title: Vercel
provider: Vercel
kind: services
category: hosting
domain: hosting
tags: [web, serverless, cdn]
pricingModel: freemium
freeTierDetails:
  summary: Free hobby deployments with monthly limits
  limits:
    - 100 GB bandwidth/month
  requiresCard: false
  freeTierType: always-free
  overageRisk: none
whenToUse: Best for quick frontend deployment and preview workflows.
whenNotToUse: Not ideal for heavy backend workloads or enterprise controls.
difficulty: beginner
productionReadiness: production-light
popularityScore: 9
usefulnessScore: 8
lastUpdated: 2026-04-24
---
```

---

## 5) API Design (Current and Future)

## 5.1 Current State

There is no public runtime API; data is resolved at build/server component boundaries and delivered as static pages.

## 5.2 Recommended Future API (for external integrations)

### Endpoints

- `GET /api/v1/entries`
- `GET /api/v1/entries/:id`
- `GET /api/v1/search?q=...`
- `GET /api/v1/facets`
- `POST /api/v1/ingest` (authenticated)

### Example: `GET /api/v1/entries?kind=services&domain=hosting&overageRisk=none`

```json
{
  "items": [
    {
      "id": "vercel",
      "kind": "services",
      "title": "Vercel",
      "provider": "Vercel",
      "domain": "hosting",
      "overageRisk": "none",
      "requiresCard": false,
      "url": "/services/vercel"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 132
}
```

### Example: `GET /api/v1/search?q=edge+functions`

```json
{
  "query": "edge functions",
  "results": [
    {
      "id": "cloudflare-workers",
      "title": "Cloudflare Workers",
      "kind": "services",
      "score": 0.92,
      "highlights": ["serverless", "edge"]
    }
  ]
}
```

---

## 6) Data Ingestion Pipeline

FreeTierWiki supports both manual and AI-assisted ingestion.

## 6.1 Manual Flow

1. Add `.mdx` file under correct content folder
2. Fill required frontmatter fields
3. Run content validation and search index generation
4. Build and verify in explorer

## 6.2 AI Batch Flow

- Batch source lists stored in `development/batch-intake/*.md`
- Prompt payloads generated as JSONL
- Model responses collected into `development/ai/*.responses.jsonl`
- Apply script writes normalized MDX entries
- Normalize and lint scripts enforce consistency
- Reports stored in `development/reports/`

---

## 7) Search Implementation

## 7.1 Build Stage

`scripts/build-search-index.mjs`:

- Reads all MDX entries
- Extracts searchable fields
- Normalizes content text
- Outputs compact search records JSON

## 7.2 Runtime Stage

`global-search.tsx`:

- Instantiates FlexSearch Document index
- Adds generated records on client load
- Returns top suggestions while typing

`explorer-table.tsx`:

- Applies query text matching + structured filters
- Supports multi-tag and decision-aware filtering

## 7.3 Ranking Pseudocode

```ts
score =
  textMatchScore(query, title, description, tags, content) * 0.55 +
  usefulnessScoreNormalized * 0.20 +
  popularityScoreNormalized * 0.15 +
  lowRiskBoost(overageRisk, requiresCard) * 0.10;
```

---

## 8) Authentication

## 8.1 Current

- Public read access
- No end-user authentication required
- Contributor auth handled at repository platform level (e.g., GitHub)

## 8.2 Future (If Admin Console/API Is Added)

- OAuth (GitHub/Microsoft) for maintainers
- Role model: `viewer`, `editor`, `reviewer`, `admin`
- Signed audit logs for content mutations

---

## 9) Error Handling Strategy

## 9.1 Build-Time Errors

- Missing required frontmatter fields => fail fast with explicit file path
- Invalid enum values => typed validation errors
- Malformed arrays/URLs/dates => structured diagnostics

## 9.2 Runtime Errors

- Invalid route params => Next.js `notFound()`
- Missing entry => 404 page
- Search failure fallback => graceful empty results

## 9.3 Contributor Feedback

- CLI scripts should report:
  - file name
  - field name
  - expected vs actual type/value
  - remediation hint

---

## 10) Performance Optimizations

- Static export + CDN delivery
- Precomputed registries (providers/domains/tags)
- Client-side indexed search (no network roundtrip)
- Efficient filtering with memoization patterns in table layer
- Image optimization disabled for static portability (`images.unoptimized`)

Future improvements:

- Search index chunking by content kind
- Web Worker for large search/filter workloads
- Incremental indexing for partial builds

---

## 11) Example Logic Snippets

## 11.1 Filter Predicate (Conceptual)

```ts
function matches(entry, filters) {
  if (filters.provider !== "all" && entry.provider !== filters.provider) return false;
  if (filters.kind !== "all" && entry.kind !== filters.kind) return false;
  if (filters.domain !== "all" && entry.domain !== filters.domain) return false;
  if (filters.overageRisk !== "all" && entry.freeTierDetails.overageRisk !== filters.overageRisk) return false;
  if (filters.requiresCard !== "all") {
    const expected = filters.requiresCard === "yes";
    if ((entry.freeTierDetails.requiresCard ?? false) !== expected) return false;
  }
  return matchesQuery(entry, filters.query);
}
```

## 11.2 Low-Risk Picks Logic (Conceptual)

```ts
const lowRisk = entries
  .filter(e => (e.freeTierDetails.overageRisk ?? "low") === "none")
  .filter(e => !(e.freeTierDetails.requiresCard ?? false))
  .slice(0, 6);
```

---

## 12) Implementation Assumptions

- Content remains source-controlled as MDX for now
- SEO and social metadata primarily derived from entry fields
- Build-time validation is authoritative for quality gates
- Runtime DB/API is optional and can be added without breaking current URL model