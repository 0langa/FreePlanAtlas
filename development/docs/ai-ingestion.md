# AI-Assisted Batch Ingestion

This workflow generates v2 MDX entries with AI while enforcing the required decision guidance fields (`whenToUse`, `whenNotToUse`).

## 1) Build AI prompts from a batch file

Run the prompt generator with a batch list (one bullet per entry):

```bash
node development/scripts/ai/build-ai-input.mjs --batch development/batch-intake/hosting.md --kind services --out development/ai/requests.jsonl
```

This creates a JSONL file containing one prompt per entry.

## 2) Generate AI output

Send each prompt to your model of choice. Each response must be **JSON only** and include the required fields.

Required decision guidance:

- `whenToUse`: 1-2 sentences, user-oriented, practical
- `whenNotToUse`: 1-2 sentences, clear constraints or tradeoffs

Required quickstart:

- `quickstartSteps`: 3-6 short setup steps, in order

### Using Foundry (GPT-4.1 deployment)

Set environment variables for your Foundry deployment:

```bash
setx FOUNDRY_ENDPOINT "https://one-model-project-resource.openai.azure.com/"
setx FOUNDRY_API_KEY "<your-api-key>"
setx FOUNDRY_DEPLOYMENT "gpt-4.1"
```

Then run:

```bash
node development/scripts/ai/run-foundry-batch.mjs --in development/ai/requests.jsonl --out development/ai/responses.jsonl
```

Optional reliability controls:

```bash
node development/scripts/ai/run-foundry-batch.mjs --in development/ai/requests.jsonl --out development/ai/responses.jsonl --retries 3 --backoffMs 1000 --rateLimitMs 250
```

## 3) Apply AI output to MDX

Save the JSON outputs as `development/ai/responses.jsonl` (one JSON object per line), then run:

```bash
node development/scripts/ai/apply-ai-output.mjs --in development/ai/responses.jsonl --out content/services
```

Use `--force true` to overwrite existing entries.

Apply will also infer a basic `docsUrl` from `officialUrl` when missing, and will set `sourceUrls` if not provided.

## 4) Normalize tags and dates

```bash
node development/scripts/ai/normalize-content.mjs content/services
```

## 5) Lint for consistency

Run the linter to catch missing docs links or inconsistent provider/category labels:

```bash
node development/scripts/ai/lint-generated-content.mjs --dir content/services
```

## 6) End-to-end batch runner

```bash
node development/scripts/ai/run-batch.mjs development/ai services
```

Optional flags:

```bash
node development/scripts/ai/run-batch.mjs --batchDir development/ai --kind services --force true
```

Run only specific batches or a limited count:

```bash
node development/scripts/ai/run-batch.mjs --batchDir development/batch-intake --batchFiles hosting.md,compute.md --kind services
node development/scripts/ai/run-batch.mjs --batchDir development/batch-intake --limit 3 --kind services
```

This runs build → Foundry batch → apply → normalize → lint for the chosen kind.
It writes `development/ai/services.requests.jsonl` and `development/ai/services.responses.jsonl` in the batch directory.

### Long-tail routing

The batch runner routes long-tail batches automatically:

- `long-tail-devtools-*` → `content/tools`
- `long-tail-docs-community*` → `content/resources`
- `long-tail-learning*` → `content/resources`
- `long-tail-saas-*` → `content/services`

## 7) Review the report

Each run writes a report into `reports/` with a summary of Foundry errors and lint warnings.

## 8) Track batch progress

After runs, a rolling batch tracking report is written to `reports/batch-tracking.md` (with a JSON companion at `reports/batch-tracking.json`).

## Output contract

Each JSON line must include the full schema (see [docs/content-schema.md](docs/content-schema.md)).
The generator enforces required fields and will error if any are missing.

## Notes

- Use conservative defaults if you are unsure about free-tier details.
- Keep list fields to 3-5 items for readability.
- If you do not know `officialUrl` or `docsUrl`, set them to an empty string.
- Provider names should be normalized (e.g., Azure, AWS, Google Cloud).
- Category should be short Title Case labels (avoid hyphenated lowercase strings).
- Quickstart steps should be actionable and specific to the service.
