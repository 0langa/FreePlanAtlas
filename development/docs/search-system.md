# Search System

FreeTierWiki uses build-generated search records and client-side FlexSearch for instant queries.

## Build Step

`npm run search:index` executes `scripts/build-search-index.mjs`.

The script:

1. scans all `content/**/*.mdx`
2. parses frontmatter
3. strips markdown into plain searchable text
4. writes `src/generated/search-index.json`

## Indexed Fields

- `title`
- `tags`
- `description`
- `content`
- `category` (stored as `domain` in the search index)
- `bestFor`

## Runtime

`src/components/layout/global-search.tsx` loads generated records into FlexSearch Document index on the client and returns instant top matches.

Explorer search remains aligned with global search via shared query terms and typed content metadata.
