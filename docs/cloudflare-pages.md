# Cloudflare Pages Deployment

This repo is configured for a fully static Next.js export (`next.config.mjs` sets `output: "export"`).

## Cloudflare Pages (Git integration)

Project settings:

- Build command: `npm run build`
- Build output directory: `out`
- Node version: `20` (set `NODE_VERSION=20`)

Optional environment variables:

- `NEXT_PUBLIC_BASE_PATH` (only if deploying under a sub-path)

## Manual deploy (Wrangler)

```bash
npm install
npm run build
npx wrangler pages deploy out
```

Local preview:

```bash
npm run build
npx wrangler pages dev out
```
