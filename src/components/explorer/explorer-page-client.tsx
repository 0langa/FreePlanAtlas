"use client";

import { useSearchParams } from "next/navigation";

import { ExplorerTable } from "@/components/explorer/explorer-table";
import type { AtlasEntry, RegistryItem } from "@/types/content";

export function ExplorerPageClient({
  data,
  providerRegistry,
  categoryRegistry,
  tagRegistry,
}: {
  data: AtlasEntry[];
  providerRegistry: RegistryItem[];
  categoryRegistry: RegistryItem[];
  tagRegistry: RegistryItem[];
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const provider = searchParams.get("provider") ?? "all";
  const tag = searchParams.get("tag") ?? "all";
  const kind = searchParams.get("kind") ?? "all";

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Universal Explorer</h1>
        <p className="max-w-3xl text-muted-foreground">
          Filter and compare free-tier options across providers, categories, and implementation patterns.
        </p>
        <p className="text-sm text-muted-foreground">
          {providerRegistry.length} providers · {tagRegistry.length} tags · {categoryRegistry.length} categories
        </p>
      </header>

      <ExplorerTable
        data={data}
        providerOptions={providerRegistry}
        tagOptions={tagRegistry}
        initialQuery={query}
        initialProvider={provider}
        initialTag={tag}
        initialKind={kind}
      />
    </div>
  );
}
