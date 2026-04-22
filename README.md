# FreeTierAtlas

FreeTierAtlas is a fully static, content-first platform for evaluating and using free-tier products with engineering-grade decision support.

## Stack

- Next.js (App Router) with static export
- TypeScript strict mode
- Tailwind CSS + shadcn/ui
- Frontmatter + MDX content pipeline (`gray-matter` + `next-mdx-remote`)
- TanStack Table explorer
- FlexSearch client search using build-generated index
- Zustand UI/filter state

## Quick Start

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev
```

## Project Layout

- `content/` source MDX entries grouped by type
- `src/app` static routes and page templates
- `src/components` layout, explorer, and content rendering modules
- `src/lib/content.ts` typed registry and navigation datasets
- `scripts/build-search-index.mjs` build-time search record generator
- `docs/` contributor and operations docs

## Build + Export

`npm run build` performs:

1. search index generation
2. Next.js build + static export (via `output: "export"`)

Artifacts are written to `out/` and are ready for any static host (GitHub Pages, Cloudflare Pages, etc.).

## Deploy to Cloudflare Pages

This site is a fully static Next.js export. Deploy it to Cloudflare Pages using:

- Build command: `npm run build`
- Build output directory: `out`
- Node version: `20` (set `NODE_VERSION=20` in Pages, or rely on `.nvmrc`/`.node-version`)

Optional environment variables:

- `NEXT_PUBLIC_BASE_PATH` (only if you serve the site from a sub-path)

More details in `docs/cloudflare-pages.md`.

## Content Categories

- services
- tools
- resources
- guides
- playbooks
- comparisons

Each entry is an MDX file with strict frontmatter and shared schema fields.

See [docs/content-schema.md](./docs/content-schema.md) and [docs/adding-content.md](./docs/adding-content.md).
