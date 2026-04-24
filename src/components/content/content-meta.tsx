import { Badge } from "@/components/ui/badge";
import {
  DOMAIN_LABELS,
  FREE_TIER_TYPE_LABELS,
  OVERAGE_RISK_LABELS,
  PRODUCTION_READINESS_LABELS,
} from "@/lib/content";
import type { AtlasEntry } from "@/types/content";

export function ContentMeta({ entry }: { entry: AtlasEntry }) {
  const freeTierType = entry.freeTierDetails.freeTierType ?? "always-free";
  const overageRisk = entry.freeTierDetails.overageRisk ?? "low";

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Provider</p>
        <p className="mt-1 text-sm font-medium">{entry.provider}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
        <p className="mt-1 text-sm font-medium">
          {DOMAIN_LABELS[entry.domain]}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Pricing</p>
        <p className="mt-1 text-sm font-medium capitalize">{entry.pricingModel}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Free Tier Type</p>
        <p className="mt-1 text-sm font-medium">{FREE_TIER_TYPE_LABELS[freeTierType]}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Overage Risk</p>
        <p className="mt-1 text-sm font-medium">{OVERAGE_RISK_LABELS[overageRisk]}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Requires Card</p>
        <p className="mt-1 text-sm font-medium">
          {entry.freeTierDetails.requiresCard ? "Yes" : "No"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Difficulty</p>
        <p className="mt-1 text-sm font-medium capitalize">{entry.difficulty}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Production Readiness</p>
        <p className="mt-1 text-sm font-medium">
          {PRODUCTION_READINESS_LABELS[entry.productionReadiness]}
        </p>
      </div>
      <div className="sm:col-span-2 xl:col-span-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {entry.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2 xl:col-span-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Audiences</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {entry.audiences.map((audience) => (
            <Badge key={audience} variant="outline">
              {audience}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
