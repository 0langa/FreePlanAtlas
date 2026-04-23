export const CANONICAL_PROVIDERS = [
  "AWS",
  "Appveyor",
  "Astro",
  "Atlassian",
  "Auth0",
  "Authgear",
  "Authress",
  "Authy",
  "Azure",
  "Buildkite",
  "Cloudflare",
  "CockroachDB",
  "Deployment.io",
  "DigitalOcean",
  "EMQX",
  "EverSQL",
  "GitHub",
  "GitLab",
  "Google Cloud",
  "IBM",
  "Khan Academy",
  "LoginLlama",
  "Microsoft",
  "MongoDB",
  "Multi-Provider",
  "Neon",
  "Oracle Cloud",
  "Pinecone",
  "PlanetScale",
  "PropelAuth",
  "Pulumi",
  "Qdrant",
  "Redis",
  "SimpleLogin",
  "Sqlable",
  "Stack Auth",
  "Supabase",
  "Twilio",
  "Upstash",
];

export const ALLOWED_PROVIDERS = new Set(CANONICAL_PROVIDERS);

const PROVIDER_ALIASES = [
  { match: /^amazon web services$/i, value: "AWS" },
  { match: /^aws$/i, value: "AWS" },
  { match: /^appveyor$/i, value: "Appveyor" },
  { match: /^astro$/i, value: "Astro" },
  { match: /^atlassian$/i, value: "Atlassian" },
  { match: /^auth0$/i, value: "Auth0" },
  { match: /^authgear$/i, value: "Authgear" },
  { match: /^authress$/i, value: "Authress" },
  { match: /^authy$/i, value: "Authy" },
  { match: /^microsoft azure$/i, value: "Azure" },
  { match: /^azure$/i, value: "Azure" },
  { match: /^buildkite$/i, value: "Buildkite" },
  { match: /^cloudflare$/i, value: "Cloudflare" },
  { match: /^cockroachdb$/i, value: "CockroachDB" },
  { match: /^deployment\.io$/i, value: "Deployment.io" },
  { match: /^digitalocean$/i, value: "DigitalOcean" },
  { match: /^emqx$/i, value: "EMQX" },
  { match: /^eversql$/i, value: "EverSQL" },
  { match: /^github$/i, value: "GitHub" },
  { match: /^gitlab$/i, value: "GitLab" },
  { match: /^google cloud$/i, value: "Google Cloud" },
  { match: /^google$/i, value: "Google Cloud" },
  { match: /^gcp$/i, value: "Google Cloud" },
  { match: /^ibm$/i, value: "IBM" },
  { match: /^khan academy$/i, value: "Khan Academy" },
  { match: /^loginllama$/i, value: "LoginLlama" },
  { match: /^microsoft$/i, value: "Microsoft" },
  { match: /^mongodb$/i, value: "MongoDB" },
  { match: /^multi\s*-\s*provider$/i, value: "Multi-Provider" },
  { match: /^neon$/i, value: "Neon" },
  { match: /^oracle cloud$/i, value: "Oracle Cloud" },
  { match: /^oracle$/i, value: "Oracle Cloud" },
  { match: /^pinecone$/i, value: "Pinecone" },
  { match: /^planetscale$/i, value: "PlanetScale" },
  { match: /^propelauth$/i, value: "PropelAuth" },
  { match: /^pulumi$/i, value: "Pulumi" },
  { match: /^qdrant$/i, value: "Qdrant" },
  { match: /^redis$/i, value: "Redis" },
  { match: /^simplelogin$/i, value: "SimpleLogin" },
  { match: /^sqlable$/i, value: "Sqlable" },
  { match: /^stack auth$/i, value: "Stack Auth" },
  { match: /^supabase$/i, value: "Supabase" },
  { match: /^twilio$/i, value: "Twilio" },
  { match: /^upstash$/i, value: "Upstash" },
];

export function normalizeProviderName(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  for (const rule of PROVIDER_ALIASES) {
    if (rule.match.test(trimmed)) {
      return rule.value;
    }
  }

  return trimmed;
}

export function validateProviderName(value) {
  const normalized = normalizeProviderName(value);
  return {
    original: String(value ?? "").trim(),
    normalized,
    isKnown: !normalized || ALLOWED_PROVIDERS.has(normalized),
  };
}

export async function collectKnownProviders({
  walkFiles,
  readFile,
  parseMatter,
  rootDir,
}) {
  const discoveredProviders = new Set(ALLOWED_PROVIDERS);

  for await (const filePath of walkFiles(rootDir)) {
    const raw = await readFile(filePath, "utf8");
    const { data } = parseMatter(raw);
    const provider = normalizeProviderName(data.provider ?? "");

    if (provider) {
      discoveredProviders.add(provider);
    }
  }

  return discoveredProviders;
}

export function validateProviderNameAgainstSet(value, knownProviders) {
  const original = String(value ?? "").trim();
  const normalized = normalizeProviderName(original);
  const providerSet = knownProviders ?? ALLOWED_PROVIDERS;

  return {
    original,
    normalized,
    isKnown: !normalized || providerSet.has(normalized),
  };
}