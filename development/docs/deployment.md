# Deployment

FreeTierWiki deploys as a static export to GitHub Pages.

## Prerequisites

- GitHub repository with Pages enabled
- Pages source set to GitHub Actions

## CI/CD Workflow

`.github/workflows/deploy.yml` performs:

1. checkout
2. Node setup + npm cache
3. dependency install
4. search index generation
5. static build/export
6. Pages artifact upload
7. deploy

## Local Validation

Before pushing:

```bash
npm run lint
npm run typecheck
npm run build:static
```

If your Pages URL uses a repository path, set `NEXT_PUBLIC_BASE_PATH` in workflow (for example `/freetierwiki`).
