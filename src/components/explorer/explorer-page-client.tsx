"use client";

import { useSearchParams } from "next/navigation";

import { ExplorerTable } from "@/components/explorer/explorer-table";
import type { AtlasEntry, RegistryItem } from "@/types/content";

export function ExplorerPageClient({
  data,
  providerRegistry,
  categoryRegistry,
  domainRegistry,
  freeTierTypeRegistry,
  overageRiskRegistry,
  productionReadinessRegistry,
  tagRegistry,
}: {
  data: AtlasEntry[];
  providerRegistry: RegistryItem[];
  categoryRegistry: RegistryItem[];
  domainRegistry: RegistryItem[];
  freeTierTypeRegistry: RegistryItem[];
  overageRiskRegistry: RegistryItem[];
  productionReadinessRegistry: RegistryItem[];
  tagRegistry: RegistryItem[];
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const provider = searchParams.get("provider") ?? "all";
  const tag = searchParams.get("tag") ?? "all";
  const kind = searchParams.get("kind") ?? "all";
  const domain = searchParams.get("domain") ?? "all";
  const freeTierType = searchParams.get("freeTierType") ?? "all";
  const overageRisk = searchParams.get("overageRisk") ?? "all";
  const productionReadiness = searchParams.get("productionReadiness") ?? "all";
  const difficulty = searchParams.get("difficulty") ?? "all";
  const requiresCard = searchParams.get("requiresCard") ?? "all";
  const sortMode = searchParams.get("sort") ?? "best-overall";

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {providerRegistry.length} providers · {domainRegistry.length} categories · {data.length} entries
        </p>
      </header>

      <ExplorerTable
        data={data}
        providerOptions={providerRegistry}
        domainOptions={domainRegistry}
        freeTierTypeOptions={freeTierTypeRegistry}
        overageRiskOptions={overageRiskRegistry}
        productionReadinessOptions={productionReadinessRegistry}
        tagOptions={tagRegistry}
        initialQuery={query}
        initialProvider={provider}
        initialTag={tag}
        initialKind={kind}
        initialDomain={domain}
        initialFreeTierType={freeTierType}
        initialOverageRisk={overageRisk}
        initialProductionReadiness={productionReadiness}
        initialDifficulty={difficulty}
        initialRequiresCard={requiresCard}
        initialSortMode={sortMode}
      />
    </div>
  );
}
