# FreeTierWiki Developer Documentation

## 1) Project Overview

FreeTierWiki is a developer-focused discovery platform for free-tier services, tools, and resources. The project curates ~800 entries with structured metadata and practical decision guidance so engineers can choose low-risk options quickly.

Core goals:

- High discoverability
- Clear categorization and filtering
- Reliable and maintainable content updates
- Fast static delivery

---

## 2) Feature List

- Universal explorer for cross-category comparison
- Global instant search with suggestions
- Entry detail pages with:
  - when-to-use / when-not-to-use guidance
  - free-tier limits and caveats
  - risk and readiness signals
- Category/provider/tag navigation
- Featured and low-risk highlights
- Light/dark mode
- AI-assisted batch content ingestion pipeline

---

## 3) Getting Started

## 3.1 Prerequisites

- Node.js 20+
- npm 10+
- Git

## 3.2 Clone and Install

```bash
git clone <repo-url>
cd FreeTierWiki
npm install
```

## 3.3 Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## 3.4 Build and Export

```bash
npm run build
```

This runs search index generation and static export to `out/`.

---

## 4) Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | No | Base path when hosting under a subdirectory |
| `GITHUB_REPOSITORY` | No | Auto-derives base path in CI environments |

AI ingestion (if used):

| Variable | Required | Purpose |
|---|---|---|
| `FOUNDRY_ENDPOINT` | Yes (AI batch) | Foundry/OpenAI endpoint |
| `FOUNDRY_API_KEY` | Yes (AI batch) | API key for batch generation |
| `FOUNDRY_DEPLOYMENT` | Yes (AI batch) | Model deployment name |

---

## 5) Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Generate search index + static build/export |
| `npm run search:index` | Regenerate search records |
| `npm run validate:content` | Validate content schema |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint checks |
| `npm run ai:launch` | Launch AI batch flow helper |

---

## 6) Content Authoring Guide

## 6.1 Where to Add Content

- `content/services`
- `content/tools`
- `content/resources`

## 6.2 Required Metadata (Minimum)

Each entry must include structured frontmatter such as:

- `title`, `description`, `provider`
- `category`, `domain`, `tags`
- `pricingModel`, `freeTierDetails.summary`, `freeTierDetails.limits`
- `useCases`, `whenToUse`, `whenNotToUse`
- `quickstartSteps`, `difficulty`, `productionReadiness`
- `lastUpdated`, `popularityScore`, `usefulnessScore`

## 6.3 Validation Workflow

1. Add/update MDX
2. Run `npm run validate:content`
3. Run `npm run search:index`
4. Run `npm run build`
5. Verify in `/explorer`

---

## 7) Testing and Quality

## 7.1 Current Quality Gates

- Type checks (`tsc --noEmit`)
- Linting (`next lint`)
- Content schema validation
- Build-time route/content integrity checks

## 7.2 Recommended Additions

- Unit tests for filtering/ranking utilities
- Snapshot tests for key page templates
- End-to-end smoke tests for explorer/search flows

---

## 8) Deployment Instructions

## 8.1 Cloudflare Pages

- Build command: `npm run build`
- Output directory: `out`
- Node version: 20

## 8.2 GitHub Pages

- Use workflow that installs deps, builds, uploads `out/`, deploys artifact
- Ensure base path is configured when deploying under repo subpath

---

## 9) Contribution Guidelines

## 9.1 Branch and PR Workflow

- Create feature branch per scope
- Keep PRs focused and reviewable
- Include before/after summary for content or behavior changes
- Link issue/ticket when available

## 9.2 Content Contribution Rules

- Prefer verifiable source URLs
- Keep claims factual and current
- Use consistent provider naming
- Avoid vague caveats; specify exact limits/trade-offs

## 9.3 Code Contribution Rules

- Follow existing TypeScript strictness
- Reuse shared types from `src/types/content.ts`
- Keep UI components composable and accessible
- Avoid introducing runtime server dependencies unless required

---

## 10) Coding Standards

- TypeScript strict mode, explicit types for domain models
- No implicit any
- Favor pure helper functions for filter/search logic
- Keep side effects at boundaries (build scripts, loaders)
- Use semantic naming over abbreviations
- Maintain stable URL and slug conventions

---

## 11) FAQ

### Q1: Is FreeTierWiki database-backed?
Current production behavior is file-backed (MDX) with build-time indexing. It is database-ready if runtime APIs are introduced later.

### Q2: Why static export instead of server rendering?
Static export provides low latency, low cost, and high reliability for read-heavy catalog usage.

### Q3: How do I add many entries quickly?
Use the AI batch ingestion workflow in `docs/ai-ingestion.md` and validate outputs before merge.

### Q4: How is search implemented?
Search records are generated at build time and queried client-side with FlexSearch.

### Q5: Do users need accounts?
Not for browsing/searching. Authentication is only needed for repository contribution workflows.

---

## 12) Onboarding Checklist (New Contributors)

- [ ] Install dependencies and run `npm run dev`
- [ ] Read `docs/content-schema.md`
- [ ] Add or edit one MDX entry
- [ ] Run `npm run validate:content`
- [ ] Regenerate index via `npm run search:index`
- [ ] Verify entry in `/explorer`
- [ ] Open PR with concise change summary