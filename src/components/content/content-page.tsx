import Link from "next/link";

import { ContentMeta } from "@/components/content/content-meta";
import { MdxContent } from "@/components/content/mdx-content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { KIND_LABELS } from "@/lib/content";
import type { AtlasEntryWithBody, ContentKind } from "@/types/content";

export function ContentPage({ entry, kind }: { entry: AtlasEntryWithBody; kind: ContentKind }) {
  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/explorer" />}>
              Explorer
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/explorer?kind=${kind}`} />}>
              {KIND_LABELS[kind]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{entry.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{KIND_LABELS[kind]}</p>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">{entry.title}</h1>
        <p className="max-w-3xl text-base text-muted-foreground">{entry.description}</p>
      </header>

      <ContentMeta entry={entry} />

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Free Tier Details</h2>
        <p className="mt-2 text-sm">{entry.freeTierDetails.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted-foreground marker:text-foreground/70">
          {entry.freeTierDetails.limits.map((limit: string) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </section>

      <Separator />

      <MdxContent source={entry.body.raw} />
    </div>
  );
}
