import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KIND_LABELS } from "@/lib/content";
import { getContentData } from "@/lib/content.server";

export default async function HomePage() {
  const { featuredEntries, navTypeItems, providerRegistry, tagRegistry } = await getContentData();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border bg-gradient-to-br from-card via-card to-muted p-8 sm:p-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">FreeTierAtlas v1</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build with free tiers like an engineer, not a guesser.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Explore opinionated service profiles, tooling picks, and implementation playbooks that prioritize free-tier constraints,
            hidden limits, and long-term upgrade paths.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/explorer"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open Explorer
            </Link>
            <Link
              href="/explorer?kind=guides"
              className="rounded-md border-2 border-foreground/40 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-foreground/60 dark:bg-foreground/5"
            >
              Start from Guides
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Featured Entries</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredEntries.map((entry) => (
            <Card key={entry.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link href={entry.url} className="hover:underline">
                    {entry.title}
                  </Link>
                </CardTitle>
                <CardDescription>{entry.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {KIND_LABELS[entry.kind as keyof typeof KIND_LABELS]} · {entry.provider}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Content Coverage</CardTitle>
            <CardDescription>Typed content categories that scale to thousands of entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {navTypeItems.map((item) => (
              <p key={item.value}>
                {item.label}: {item.count}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Footprint</CardTitle>
            <CardDescription>Seeded providers in the initial launch dataset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {providerRegistry.slice(0, 8).map((item) => (
              <p key={item.value}>{item.value}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tag Graph</CardTitle>
            <CardDescription>Cross-cutting tags for rapid discovery and filtering.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {tagRegistry.slice(0, 14).map((item) => (
              <Link
                key={item.value}
                href={`/explorer?tag=${encodeURIComponent(item.value)}`}
                className="rounded-full border px-2 py-1 transition-colors hover:bg-accent"
              >
                {`#${item.value}`}
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
