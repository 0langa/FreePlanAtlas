import { Suspense } from "react";

import { ExplorerPageClient } from "@/components/explorer/explorer-page-client";
import { getContentData } from "@/lib/content.server";

export default async function ExplorerPage() {
  const {
    allEntries,
    providerRegistry,
    categoryRegistry,
    domainRegistry,
    freeTierTypeRegistry,
    overageRiskRegistry,
    productionReadinessRegistry,
    tagRegistry,
  } = await getContentData();

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading explorer…</div>}>
      <ExplorerPageClient
        data={allEntries}
        providerRegistry={providerRegistry}
        categoryRegistry={categoryRegistry}
        domainRegistry={domainRegistry}
        freeTierTypeRegistry={freeTierTypeRegistry}
        overageRiskRegistry={overageRiskRegistry}
        productionReadinessRegistry={productionReadinessRegistry}
        tagRegistry={tagRegistry}
      />
    </Suspense>
  );
}
