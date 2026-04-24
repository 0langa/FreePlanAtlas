# FreeTierWiki Project State

## 1) Current Status

**Stage:** Late MVP / Early Production Beta

Rationale:

- Core discovery and browsing experience is complete and usable
- Content volume is substantial (~800 entries target)
- Build/deploy pipeline is operational for static hosting
- Some enterprise-grade capabilities (runtime API, personalization, advanced analytics) are not yet implemented

---

## 2) Completed Features

## 2.1 User-Facing

- Home page with featured and low-risk highlights
- Universal explorer with rich multi-filter/sort capabilities
- Global instant search suggestions
- Detail pages with decision guidance and free-tier metadata
- Category/provider/tag-driven navigation
- Theme toggle (light/dark)

## 2.2 Content and Data

- Structured frontmatter schema for services/tools/resources
- Normalized domain and risk model
- Build-time registry generation for facets
- Search index generation from MDX corpus

## 2.3 Delivery

- Static export architecture
- Cloud deployment compatibility (Cloudflare Pages/GitHub Pages)
- CI-friendly build command chain

## 2.4 Content Operations

- AI-assisted batch ingestion workflow
- Linting/validation scripts for consistency
- Batch tracking and reporting artifacts

---

## 3) Known Limitations

- No public runtime API for external integrations
- Search relevance is primarily lexical (no semantic ranking yet)
- Personalization is not implemented
- Client-side index size may grow with catalog expansion
- No authenticated admin dashboard for in-browser content editing
- Limited automated test suite depth for core user flows

---

## 4) Technical Debt

## 4.1 Architecture Debt

- Tight coupling between content model and MDX frontmatter shape
- Build-time-only data access limits real-time freshness
- Some docs reference historical naming and may need periodic consistency sweeps

## 4.2 Code Debt

- Explorer filtering/sorting logic can become monolithic without modular extraction
- Need clearer separation between ranking heuristics and UI concerns
- Potential duplication across scripts for normalization/lint pipelines

## 4.3 Operations Debt

- Manual governance for stale entries could be improved
- Source verification recency checks could be automated
- Contributor QA workflow can be strengthened with PR templates/checklists

---

## 5) Roadmap

## 5.1 Short-Term (0–2 months)

- Finalize branding consistency (`FreeTierWiki`, `FreeTier.wiki`) across all docs/content prompts
- Improve validation diagnostics (actionable field-level errors)
- Add regression tests for explorer filters and URL-state behavior
- Add stale-content detection rule (e.g., `lastUpdated` threshold)
- Improve docs for contributor onboarding and review workflow

## 5.2 Mid-Term (2–6 months)

- Introduce optional runtime API (`/api/v1/entries`, `/api/v1/search`, `/api/v1/facets`)
- Move search index generation to incremental pipeline
- Add semantic search augmentation (hybrid lexical + embeddings)
- Add usage analytics dashboard for top queries/zero-result terms
- Add quality scoring workflows for content confidence and freshness

## 5.3 Long-Term (6–12+ months)

- Personalization (role/use-case-based ranking)
- Public developer API keys and rate-limited API access
- Community submissions with moderation queue
- Multilingual content support
- Automated provider-change monitoring (pricing/free-tier drift alerts)

---

## 6) Future Enhancements

## 6.1 AI Search and Recommendation

- Hybrid retrieval: lexical + vector search
- Intent-aware ranking (e.g., “no card + production-ready + auth”)
- Natural-language query explanations and comparison summaries

## 6.2 Personalization

- Saved filters and comparison lists
- Audience presets (student/startup/team)
- Region/compliance-aware recommendations

## 6.3 External Integrations

- Public API for third-party apps
- Embeddable widgets (top low-risk picks by domain)
- Webhooks for updated entries in selected categories

## 6.4 Data Quality Automation

- Scheduled source URL validation
- Provider naming normalization bot
- Auto-flagging inconsistent risk metadata

---

## 7) Open Challenges

## 7.1 Freshness at Scale

Maintaining high-quality, up-to-date free-tier metadata across hundreds of providers is the primary ongoing challenge.

## 7.2 Relevance Quality

Balancing objective metadata (limits/risk) with subjective utility signals (popularity/usefulness) requires continuous tuning.

## 7.3 Performance vs Richness

As the dataset grows, preserving instant UX while expanding facets/search depth requires index and payload strategy improvements.

## 7.4 Governance

Ensuring consistent editorial standards across human and AI-assisted contributions demands stronger automated checks and reviewer workflows.

---

## 8) Recommended Next Milestones

1. **Milestone A (Stability):** testing + validation hardening
2. **Milestone B (Intelligence):** hybrid search + ranking improvements
3. **Milestone C (Platform):** public API + auth/rate-limit foundation
4. **Milestone D (Ecosystem):** community contributions + moderation tooling

---

## 9) Summary

FreeTierWiki has a strong static-first foundation, a clear domain model, and a practical user experience for discovering free-tier developer services. The next phase should focus on reliability at scale, search intelligence, and platformization (API + personalization) while preserving the project’s core strengths: clarity, speed, and decision-first usefulness.