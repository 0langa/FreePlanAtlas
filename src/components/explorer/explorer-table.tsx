"use client";

import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DOMAIN_LABELS,
  FREE_TIER_TYPE_LABELS,
  KIND_LABELS,
  OVERAGE_RISK_LABELS,
  PRICING_MODEL_LABELS,
  PRODUCTION_READINESS_LABELS,
} from "@/lib/content";
import { useExplorerStore } from "@/store/explorer-store";
import type {
  AtlasEntry,
  ContentKind,
  FilterDifficulty,
  RegistryItem,
} from "@/types/content";

type ExplorerTableProps = {
  data: AtlasEntry[];
  providerOptions: RegistryItem[];
  domainOptions: RegistryItem[];
  freeTierTypeOptions: RegistryItem[];
  overageRiskOptions: RegistryItem[];
  productionReadinessOptions: RegistryItem[];
  tagOptions: RegistryItem[];
  initialQuery: string;
  initialProvider: string;
  initialTag: string;
  initialKind: string;
  initialDomain: string;
  initialFreeTierType: string;
  initialOverageRisk: string;
  initialProductionReadiness: string;
  initialDifficulty: string;
  initialRequiresCard: string;
  initialSortMode: string;
};

const columns: ColumnDef<AtlasEntry>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-1">
          <Link href={entry.url} className="font-medium hover:underline">
            {entry.title}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
  {
    accessorKey: "kind",
    header: "Type",
    cell: ({ row }) => KIND_LABELS[row.original.kind as ContentKind],
  },
  {
    accessorKey: "domain",
    header: "Category",
    cell: ({ row }) => DOMAIN_LABELS[row.original.domain],
  },
  {
    accessorKey: "pricingModel",
    header: "Pricing",
    cell: ({ row }) =>
      PRICING_MODEL_LABELS[row.original.pricingModel as keyof typeof PRICING_MODEL_LABELS],
  },
  {
    accessorKey: "freeTierDetails.freeTierType",
    header: "Free Tier",
    cell: ({ row }) =>
      FREE_TIER_TYPE_LABELS[
        (row.original.freeTierDetails.freeTierType ?? "always-free") as keyof typeof FREE_TIER_TYPE_LABELS
      ],
  },
  {
    accessorKey: "freeTierDetails.overageRisk",
    header: "Overage Risk",
    cell: ({ row }) =>
      OVERAGE_RISK_LABELS[
        (row.original.freeTierDetails.overageRisk ?? "low") as keyof typeof OVERAGE_RISK_LABELS
      ],
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => (
      <span className="inline-block min-w-[7.5rem] overflow-hidden text-ellipsis whitespace-nowrap capitalize">
        {row.original.difficulty}
      </span>
    ),
  },
  {
    accessorKey: "productionReadiness",
    header: "Readiness",
    cell: ({ row }) =>
      PRODUCTION_READINESS_LABELS[row.original.productionReadiness as keyof typeof PRODUCTION_READINESS_LABELS],
  },
  {
    accessorKey: "usefulnessScore",
    header: "Usefulness",
  },
  {
    accessorKey: "popularityScore",
    header: "Popularity",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.slice(0, 3).map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    ),
  },
];

const SORT_LABELS: Record<string, string> = {
  "best-overall": "Best overall",
  "lowest-risk": "Lowest billing risk",
  "easiest-start": "Easiest to start",
  "no-card": "Best no-card options",
  "production-ready": "Best for production-light",
};

function formatSelectLabel({
  label,
  value,
  total,
  valueLabel,
}: {
  label: string;
  value: string;
  total: number;
  valueLabel?: string;
}) {
  if (value === "all") {
    return `${label} (all ${total})`;
  }

  return `${label}: ${valueLabel ?? value} (1/${total})`;
}

function matchesQuery(entry: AtlasEntry, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    entry.title,
    entry.description,
    entry.provider,
    entry.category,
    entry.domain,
    entry.productionReadiness,
    ...entry.tags,
    ...entry.useCases,
    ...entry.bestFor,
    ...entry.avoidIf,
    ...entry.subtypes,
    ...entry.audiences,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

type FilterState = {
  query: string;
  provider: string;
  tag: string;
  kind: string;
  domain: string;
  freeTierType: string;
  overageRisk: string;
  productionReadiness: string;
  difficulty: string;
  requiresCard: string;
  selectedTags: string[];
};

function matchesFilters(entry: AtlasEntry, filters: FilterState): boolean {
  const {
    query,
    provider,
    tag,
    kind,
    domain,
    freeTierType,
    overageRisk,
    productionReadiness,
    difficulty,
    requiresCard,
    selectedTags,
  } = filters;

  if (provider !== "all" && entry.provider !== provider) {
    return false;
  }
  if (kind !== "all" && entry.kind !== kind) {
    return false;
  }
  if (domain !== "all" && entry.domain !== domain) {
    return false;
  }
  if (freeTierType !== "all" && (entry.freeTierDetails.freeTierType ?? "always-free") !== freeTierType) {
    return false;
  }
  if (overageRisk !== "all" && (entry.freeTierDetails.overageRisk ?? "low") !== overageRisk) {
    return false;
  }
  if (productionReadiness !== "all" && entry.productionReadiness !== productionReadiness) {
    return false;
  }
  if (difficulty !== "all" && entry.difficulty !== difficulty) {
    return false;
  }
  if (requiresCard !== "all") {
    const expected = requiresCard === "yes";
    if ((entry.freeTierDetails.requiresCard ?? false) !== expected) {
      return false;
    }
  }
  if (tag !== "all" && !entry.tags.includes(tag)) {
    return false;
  }
  if (selectedTags.length > 0 && !selectedTags.every((selected) => entry.tags.includes(selected))) {
    return false;
  }

  return matchesQuery(entry, query);
}

function buildCounts<T extends string>(
  entries: AtlasEntry[],
  getValue: (entry: AtlasEntry) => T,
): Map<T, number> {
  const counts = new Map<T, number>();
  for (const entry of entries) {
    const value = getValue(entry);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function ExplorerTable({
  data,
  providerOptions,
  domainOptions,
  freeTierTypeOptions,
  overageRiskOptions,
  productionReadinessOptions,
  tagOptions,
  initialQuery,
  initialProvider,
  initialTag,
  initialKind,
  initialDomain,
  initialFreeTierType,
  initialOverageRisk,
  initialProductionReadiness,
  initialDifficulty,
  initialRequiresCard,
  initialSortMode,
}: ExplorerTableProps) {
  const {
    query,
    provider,
    tag,
    kind,
    domain,
    freeTierType,
    overageRisk,
    productionReadiness,
    difficulty,
    requiresCard,
    sortMode,
    setQuery,
    setProvider,
    setTag,
    setKind,
    setDomain,
    setFreeTierType,
    setOverageRisk,
    setProductionReadiness,
    setDifficulty,
    setRequiresCard,
    setSortMode,
    initialize,
  } = useExplorerStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const kindTotal = Object.keys(KIND_LABELS).length;
  const providerTotal = providerOptions.length;
  const domainTotal = domainOptions.length;
  const tagTotal = tagOptions.length;
  const freeTierTypeTotal = freeTierTypeOptions.length;
  const overageRiskTotal = overageRiskOptions.length;
  const productionReadinessTotal = productionReadinessOptions.length;
  const difficultyTotal = 3;
  const requiresCardTotal = 2;

  React.useEffect(() => {
    initialize({
      query: initialQuery,
      provider: initialProvider || "all",
      tag: initialTag || "all",
      kind: initialKind || "all",
      domain: initialDomain || "all",
      freeTierType: initialFreeTierType || "all",
      overageRisk: initialOverageRisk || "all",
      productionReadiness: initialProductionReadiness || "all",
      difficulty: initialDifficulty || "all",
      requiresCard: initialRequiresCard || "all",
      sortMode: initialSortMode || "best-overall",
    });
  }, [
    initialDifficulty,
    initialDomain,
    initialFreeTierType,
    initialKind,
    initialOverageRisk,
    initialProductionReadiness,
    initialProvider,
    initialQuery,
    initialRequiresCard,
    initialSortMode,
    initialTag,
    initialize,
  ]);

  const rankEntry = React.useCallback(
    (entry: AtlasEntry): number => {
      const usefulness = entry.usefulnessScore ?? 0;
      const popularity = entry.popularityScore ?? 0;
      const overage = entry.freeTierDetails.overageRisk ?? "low";
      const requires = entry.freeTierDetails.requiresCard ?? false;
      const readiness = entry.productionReadiness;

      switch (sortMode) {
        case "lowest-risk":
          return (
            (overage === "none" ? 100 : overage === "low" ? 75 : overage === "medium" ? 40 : 10) +
            (requires ? 0 : 20)
          );
        case "easiest-start":
          return entry.difficulty === "beginner" ? 100 : entry.difficulty === "intermediate" ? 70 : 40;
        case "no-card":
          return requires ? 0 : 100;
        case "production-ready":
          return readiness === "production-ready" ? 100 : readiness === "production-light" ? 70 : 30;
        case "best-overall":
        default:
          return usefulness * 0.65 + popularity * 0.35;
      }
    },
    [sortMode],
  );

  const filteredData = React.useMemo(() => {
    const matched = data.filter((entry) => {
      return matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      });
    });

    return matched.sort((a, b) => rankEntry(b) - rankEntry(a));
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    rankEntry,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const providerCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider: "all",
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => entry.provider);
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const kindCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind: "all",
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => entry.kind as ContentKind);
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    overageRisk,
    productionReadiness,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const domainCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain: "all",
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => entry.domain);
  }, [
    data,
    difficulty,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const tagCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag: "all",
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags: [],
      }),
    );

    const counts = new Map<string, number>();
    for (const entry of countsData) {
      for (const entryTag of entry.tags) {
        counts.set(entryTag, (counts.get(entryTag) ?? 0) + 1);
      }
    }
    return counts;
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    requiresCard,
  ]);

  const freeTierTypeCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType: "all",
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(
      countsData,
      (entry) => (entry.freeTierDetails.freeTierType ?? "always-free") as string,
    );
  }, [
    data,
    difficulty,
    domain,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const overageRiskCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk: "all",
        productionReadiness,
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(
      countsData,
      (entry) => (entry.freeTierDetails.overageRisk ?? "low") as string,
    );
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    productionReadiness,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const productionReadinessCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness: "all",
        difficulty,
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => entry.productionReadiness);
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    overageRisk,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const difficultyCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty: "all",
        requiresCard,
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => entry.difficulty as FilterDifficulty);
  }, [
    data,
    domain,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    requiresCard,
    selectedTags,
    tag,
  ]);

  const requiresCardCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tag,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard: "all",
        selectedTags,
      }),
    );
    return buildCounts(countsData, (entry) => (entry.freeTierDetails.requiresCard ? "yes" : "no"));
  }, [
    data,
    difficulty,
    domain,
    freeTierType,
    kind,
    overageRisk,
    productionReadiness,
    provider,
    query,
    selectedTags,
    tag,
  ]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Search title, tags, provider..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="xl:col-span-2"
          />
          <Select value={kind} onValueChange={(value) => setKind(value ?? "all")}>
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Types",
                  value: kind,
                  total: kindTotal,
                  valueLabel: KIND_LABELS[kind as ContentKind],
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(KIND_LABELS)
                .filter(([value]) => (kindCounts.get(value as ContentKind) ?? 0) > 0)
                .map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label} ({kindCounts.get(value as ContentKind) ?? 0})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={provider} onValueChange={(value) => setProvider(value ?? "all")}>
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Providers",
                  value: provider,
                  total: providerTotal,
                  valueLabel: provider === "all" ? undefined : provider,
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providerOptions
                .filter((item) => (providerCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.value} ({providerCounts.get(item.value) ?? 0})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={domain} onValueChange={(value) => setDomain(value ?? "all")}> 
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Categories",
                  value: domain,
                  total: domainTotal,
                  valueLabel: DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS],
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {domainOptions
                .filter((item) => (domainCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {DOMAIN_LABELS[item.value as keyof typeof DOMAIN_LABELS]} ({
                      domainCounts.get(item.value) ?? 0
                    })
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={tag} onValueChange={(value) => setTag(value ?? "all")}>
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Primary tag",
                  value: tag,
                  total: tagTotal,
                  valueLabel: tag === "all" ? undefined : tag,
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tagOptions
                .filter((item) => (tagCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.value} ({tagCounts.get(item.value) ?? 0})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={freeTierType} onValueChange={(value) => setFreeTierType(value ?? "all")}> 
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Free tier",
                  value: freeTierType,
                  total: freeTierTypeTotal,
                  valueLabel: FREE_TIER_TYPE_LABELS[freeTierType as keyof typeof FREE_TIER_TYPE_LABELS],
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {freeTierTypeOptions
                .filter((item) => (freeTierTypeCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {FREE_TIER_TYPE_LABELS[item.value as keyof typeof FREE_TIER_TYPE_LABELS]} ({
                      freeTierTypeCounts.get(item.value) ?? 0
                    })
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={overageRisk} onValueChange={(value) => setOverageRisk(value ?? "all")}> 
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Overage risk",
                  value: overageRisk,
                  total: overageRiskTotal,
                  valueLabel: OVERAGE_RISK_LABELS[overageRisk as keyof typeof OVERAGE_RISK_LABELS],
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {overageRiskOptions
                .filter((item) => (overageRiskCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {OVERAGE_RISK_LABELS[item.value as keyof typeof OVERAGE_RISK_LABELS]} ({
                      overageRiskCounts.get(item.value) ?? 0
                    })
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={productionReadiness}
            onValueChange={(value) => setProductionReadiness(value ?? "all")}
          >
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Readiness",
                  value: productionReadiness,
                  total: productionReadinessTotal,
                  valueLabel:
                    PRODUCTION_READINESS_LABELS[
                      productionReadiness as keyof typeof PRODUCTION_READINESS_LABELS
                    ],
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All readiness levels</SelectItem>
              {productionReadinessOptions
                .filter((item) => (productionReadinessCounts.get(item.value) ?? 0) > 0)
                .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {PRODUCTION_READINESS_LABELS[item.value as keyof typeof PRODUCTION_READINESS_LABELS]} ({
                      productionReadinessCounts.get(item.value) ?? 0
                    })
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={difficulty} onValueChange={(value) => setDifficulty(value ?? "all")}> 
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Difficulty",
                  value: difficulty,
                  total: difficultyTotal,
                  valueLabel: difficulty === "all" ? undefined : difficulty,
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty</SelectItem>
              {(["beginner", "intermediate", "advanced"] as FilterDifficulty[])
                .filter((level) => (difficultyCounts.get(level) ?? 0) > 0)
                .map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)} ({difficultyCounts.get(level) ?? 0})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={requiresCard} onValueChange={(value) => setRequiresCard(value ?? "all")}> 
            <SelectTrigger>
              <span className="truncate text-sm">
                {formatSelectLabel({
                  label: "Card",
                  value: requiresCard,
                  total: requiresCardTotal,
                  valueLabel:
                    requiresCard === "yes"
                      ? "Requires card"
                      : requiresCard === "no"
                        ? "No card"
                        : undefined,
                })}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All card requirements</SelectItem>
              {(requiresCardCounts.get("yes") ?? 0) > 0 && (
                <SelectItem value="yes">Requires card ({requiresCardCounts.get("yes") ?? 0})</SelectItem>
              )}
              {(requiresCardCounts.get("no") ?? 0) > 0 && (
                <SelectItem value="no">No card required ({requiresCardCounts.get("no") ?? 0})</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(value) => setSortMode(value ?? "best-overall")}> 
            <SelectTrigger>
              <span className="truncate text-sm">Ranking: {SORT_LABELS[sortMode] ?? "Best overall"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best-overall">Best overall</SelectItem>
              <SelectItem value="lowest-risk">Lowest billing risk</SelectItem>
              <SelectItem value="easiest-start">Easiest to start</SelectItem>
              <SelectItem value="no-card">Best no-card options</SelectItem>
              <SelectItem value="production-ready">Best for production-light</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Tag filter set: {selectedTags.length}/{tagTotal} selected
          </p>
          {tagOptions.slice(0, 10).map((item) => {
            const checked = selectedTags.includes(item.value);
            return (
              <label key={item.value} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    if (value) {
                      setSelectedTags((current) => [...current, item.value]);
                    } else {
                      setSelectedTags((current) => current.filter((tagItem) => tagItem !== item.value));
                    }
                  }}
                />
                {item.value}
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filteredData.length} entries matched.</p>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    (() => {
                      const headerValue = column.columnDef.header;
                      const label = typeof headerValue === "string" ? headerValue : column.id;
                      return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                      );
                    })()
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results with the active filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
