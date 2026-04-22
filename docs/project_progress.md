# Project Progress (v2)

## Status

- Phase 1: Architectural decisions locked
- Phase 2: Schema/type system upgraded
- Phase 3: Loader/search metadata updated
- Phase 4: Explorer and navigation refactor in progress
- Phase 5: Page templates updated
- Phase 6: Documentation updated
- Phase 7: Validation pending

## Completed

- Added decision-first metadata types (`domain`, `freeTierType`, `overageRisk`, `productionReadiness`, `audiences`).
- Updated content loader to normalize missing v2 fields.
- Added registries for domain and risk filters.
- Expanded search index to include v2 metadata.
- Updated global search to index `domain` and `bestFor`.
- Added v2 sections to entry pages (best for, avoid if, billing risk notes).
- Updated homepage messaging and sections.
- Updated contributor docs and schema docs.

## In Progress

- Explorer UI and filter model validation.
- Navigation refinement with domains.

## Remaining

- Verify the explorer filters and ranking modes with real data.
- Run `npm run typecheck`, `npm run search:index`, and `npm run build`.
- Update any remaining UI components that assume v1-only fields.

## Risks

- Legacy MDX files still rely on old frontmatter. The loader infers v2 fields, but manual upgrades are still needed for best accuracy.
- Search index must be regenerated to reflect v2 fields.

## Validation Checklist

- [ ] `npm run typecheck`
- [ ] `npm run search:index`
- [ ] `npm run build`
- [ ] `/explorer` shows domain and risk filters
- [ ] `/` shows low-risk picks and domains
- [ ] Entry pages show decision sections
- [ ] Global search returns results for domain queries
