# FreeTierWiki

**Choose free tiers with real constraints, not wishful thinking.**

FreeTierWiki is a decision-first atlas for evaluating free-tier services, tools, and learning resources. It helps developers, indie hackers, startups, and students pick the lowest-risk free-tier options first by comparing services across billing risk, quota shape, and production readiness.

---

## What Is FreeTierWiki?

Every free tier comes with limits, gotchas, and hidden risks. FreeTierWiki collects hundreds of free-tier offerings—cloud services, developer tools, and learning resources—and evaluates each one on what actually matters:

- **Billing risk** — Will you get surprised by a credit card charge?
- **Quota shape** — Is it always-free, time-limited, credit-based, or a trial?
- **Production readiness** — Can you ship a side project, prototype, or real product?
- **When to use vs. when not to use** — Clear guidance on fit and trade-offs

### What You’ll Find

| Category | Description | Examples |
|---|---|---|
| **Services** | Hosted platforms and runtimes you build on | Vercel, Fly.io, Supabase, Cloudflare Workers, Azure App Service |
| **Tools** | Products used to build, test, deploy, or operate | Postman, GitHub Actions, Sentry, Terraform, Cypress |
| **Resources** | Learning material and reference docs | freeCodeCamp, The Odin Project, MIT OpenCourseWare |

---

## How to Use the Website

### 1. Start on the Home Page

The home page gives you a quick overview:

- **Featured Entries** — Hand-picked highlights worth exploring
- **Low-Risk Free Tier Picks** — Services with no overage risk and no credit card required
- **Content Coverage** — How many entries we have in each category
- **Top Categories & Providers** — Quick links to popular domains
- **Tag Graph** — Click any tag to explore related services

### 2. Explore with the Universal Explorer

Click **Open Explorer** or **Browse by Category** to open the main filtering interface.

The Explorer is a powerful table where you can filter and compare entries across many dimensions:

#### Search
Type keywords into the search bar at the top of the page. Search matches:
- Service name and description
- Provider name
- Tags, use cases, and categories

#### Filter Dropdowns
| **Category** | Pick a domain like Hosting, Compute, Database, Auth, AI, DevOps |
| **Type** | Show only Services, Tools, or Resources |
| **Free Tier Type** | Always free, Time-limited, Credit-based, or Trial |
| **Overage Risk** | None, Low, Medium, or High chance of unexpected charges |
| **Production Readiness** | Prototype, Side project, Production-light, or Production-ready |
| **Difficulty** | Beginner, Intermediate, or Advanced setup |
| **Requires Card** | Yes/No — filter out services that demand a credit card |

#### Sort Options
Change the sort mode to reorder results:

- **Best overall** — Balanced ranking of popularity and usefulness
- **Lowest billing risk** — Safest options first
- **Easiest to start** — Beginner-friendly first
- **Best no-card options** — No credit card required
- **Best for production-light** — Most production-ready first

#### Column Visibility
Click the **Columns** dropdown to show or hide columns in the table. Customize the view to focus on what matters to you.

### 3. Read an Entry Detail Page

Click any service name in the Explorer to open its full detail page. Each page contains:

#### Decision Guidance
- **When to Use** — Practical, user-oriented advice on ideal use cases
- **When Not to Use** — Clear constraints and trade-offs

#### At-a-Glance Meta Card
- Provider, Category, Pricing model
- Free tier type (Always free, Trial, etc.)
- Overage risk level
- Whether a credit card is required
- Difficulty level
- Production readiness rating
- Tags and target audiences
#### Free Tier Details
- Summary of what the free tier includes
- Exact limits (requests, storage, bandwidth, users, etc.)
- Caveats and catches
- Reset period (monthly, daily, etc.)
- Full MDX-rendered content with extra context, links, and notes
#### Official Links
- Official website
- Documentation URL


On larger screens, the left sidebar provides quick links:



Toggle between light and dark themes using the sun/moon icon in the top-right corner of the header.

---

## Understanding the Ratings & Labels

### Overage Risk

| Level | Meaning |
|---|---|
| **None** | Hard cap or truly free — no way to be accidentally charged |
| **Low** | Some risk if you exceed limits, but usually blocked or throttled |
| **Medium** | Possible overages; monitor usage carefully |

### Production Readiness

| Level | Meaning |
|---|---|
| **Side project** | Solid for personal projects and MVPs |
| **Production-light** | Can handle light production traffic with care |
| **Production-ready** | Trusted for real workloads |
 `development/docs/` contributor and operations docs
### Difficulty

| Level | Meaning |
|---|---|
| **Beginner** | Sign up and go; minimal configuration |
| **Intermediate** | Some setup, CLI, or config required |
| **Advanced** | Requires significant expertise or infrastructure knowledge |

---

## Content Coverage

FreeTierWiki covers free-tier offerings across the major cloud providers and indie services:

- **Hosting** — Vercel, Netlify, Fly.io, Render, GitHub Pages, Cloudflare Pages
- **Compute** — AWS Lambda, Azure Functions, Cloudflare Workers, Google Cloud Run
- **Database** — Supabase, PlanetScale, Neon, Turso, MongoDB Atlas, Azure Cosmos DB
- **Auth** — Clerk, Auth0, Supabase Auth, Firebase Auth, Keycloak alternatives
- **Storage** — Cloudflare R2, Backblaze B2, Azure Blob Storage, S3 Free Tier
- **AI / ML** — OpenAI API free credits, Hugging Face, Groq, Azure AI services
- **DevOps** — GitHub Actions, GitLab CI/CD, Terraform Cloud, Sentry, Datadog
- **Messaging** — Ably, Pusher, PubNub, Azure Service Bus
- **Observability** — Grafana Cloud, New Relic, UptimeRobot, Logtail
- **Learning** — freeCodeCamp, The Odin Project, MIT OpenCourseWare, Full Stack Open

---

## Who Is This For?

- **Students** — Learning cloud and web development without spending money
- **Indie Hackers** — Building side projects and MVPs on zero budget
- **Startups** — Stretching runway by choosing safe free tiers first
- **Open Source Maintainers** — Finding free hosting and tooling for projects
- **Teams** — Evaluating low-risk options for prototyping and internal tools

---

## Tech Stack

- Next.js (App Router) with static export
- TypeScript strict mode
- Tailwind CSS + shadcn/ui
- Frontmatter + MDX content pipeline
- TanStack Table explorer
- FlexSearch client search using build-generated index
- Zustand UI/filter state

---

## Local Development

```bash
npm install
npm run dev
```

Build with search index generation:

```bash
npm run build
```

---

## License

MIT — see the GitHub repository for details.

---

*FreeTierWiki is a living catalog. Entries are updated as providers change their free-tier terms. Always verify current pricing and limits on the provider’s official website before making architectural decisions.*
