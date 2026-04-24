"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
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
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ProductionReadiness,
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

const DEFAULT_DESKTOP_COLUMNS: VisibilityState = {
  pricingModel: false,
  usefulnessScore: false,
  popularityScore: false,
};

const COLUMN_STORAGE_KEY = "freetierwiki.explorer.columns";
const TAG_STORAGE_KEY = "freetierwiki.explorer.selected-tags";

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
  tags: string[];
  kind: string;
  domain: string;
  freeTierType: string;
  overageRisk: string;
  productionReadiness: string;
  difficulty: string;
  requiresCard: string;
};

function matchesFilters(entry: AtlasEntry, filters: FilterState): boolean {
  const {
    query,
    provider,
    tags,
    kind,
    domain,
    freeTierType,
    overageRisk,
    productionReadiness,
    difficulty,
    requiresCard,
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
  if (tags.length > 0 && !tags.every((selected) => entry.tags.includes(selected))) {
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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(DEFAULT_DESKTOP_COLUMNS);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(() =>
    initialTag && initialTag !== "all" ? [initialTag] : [],
  );
  const [tagQuery, setTagQuery] = React.useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [showAllMatchingTags, setShowAllMatchingTags] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

  const kindTotal = Object.keys(KIND_LABELS).length;
  const providerTotal = providerOptions.length;
  const domainTotal = domainOptions.length;
  const freeTierTypeTotal = freeTierTypeOptions.length;
  const overageRiskTotal = overageRiskOptions.length;
  const productionReadinessTotal = productionReadinessOptions.length;
  const difficultyTotal = 3;
  const requiresCardTotal = 2;

  React.useEffect(() => {
    initialize({
      query: initialQuery,
      provider: initialProvider || "all",
      tag: "all",
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
    initialize,
  ]);

  React.useEffect(() => {
    setSelectedTags(initialTag && initialTag !== "all" ? [initialTag] : []);
  }, [initialTag]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (initialTag && initialTag !== "all") {
      return;
    }

    const saved = window.localStorage.getItem(TAG_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed)) {
        setSelectedTags(parsed.filter((value) => typeof value === "string"));
      }
    } catch {
      window.localStorage.removeItem(TAG_STORAGE_KEY);
    }
  }, [initialTag]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as VisibilityState;
      setColumnVisibility({
        ...DEFAULT_DESKTOP_COLUMNS,
        ...parsed,
      });
    } catch {
      window.localStorage.removeItem(COLUMN_STORAGE_KEY);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  React.useEffect(() => {
    setShowAllMatchingTags(false);
  }, [tagQuery]);

  React.useEffect(() => {
    setTag(selectedTags[0] ?? "all");
  }, [selectedTags, setTag]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(selectedTags));
  }, [selectedTags]);

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
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
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
  ]);

  const providerCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider: "all",
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
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
  ]);

  const kindCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind: "all",
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
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
  ]);

  const domainCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind,
        domain: "all",
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
      }),
    );
    return buildCounts<string>(countsData, (entry) => entry.domain);
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
  ]);

  const tagCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: [],
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
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
        tags: selectedTags,
        kind,
        domain,
        freeTierType: "all",
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard,
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
  ]);

  const overageRiskCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk: "all",
        productionReadiness,
        difficulty,
        requiresCard,
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
  ]);

  const productionReadinessCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness: "all",
        difficulty,
        requiresCard,
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
  ]);

  const difficultyCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty: "all",
        requiresCard,
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
  ]);

  const requiresCardCounts = React.useMemo(() => {
    const countsData = data.filter((entry) =>
      matchesFilters(entry, {
        query,
        provider,
        tags: selectedTags,
        kind,
        domain,
        freeTierType,
        overageRisk,
        productionReadiness,
        difficulty,
        requiresCard: "all",
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
  ]);

  const visibleTagOptions = React.useMemo(() => {
    const normalizedQuery = tagQuery.trim().toLowerCase();
    const sorted = tagOptions
      .filter((item) => (tagCounts.get(item.value) ?? 0) > 0)
      .sort((a, b) => (tagCounts.get(b.value) ?? 0) - (tagCounts.get(a.value) ?? 0));

    const matching = !normalizedQuery
      ? sorted
      : sorted.filter((item) => item.value.toLowerCase().includes(normalizedQuery));

    return showAllMatchingTags ? matching : matching.slice(0, 12);
  }, [showAllMatchingTags, tagCounts, tagOptions, tagQuery]);

  const featuredTagOptions = React.useMemo(
    () =>
      tagOptions
        .filter((item) => (tagCounts.get(item.value) ?? 0) > 0)
        .sort((a, b) => (tagCounts.get(b.value) ?? 0) - (tagCounts.get(a.value) ?? 0))
        .slice(0, 8),
    [tagCounts, tagOptions],
  );

  const toggleTag = React.useCallback((value: string) => {
    setSelectedTags((current) =>
      current.includes(value) ? current.filter((tagItem) => tagItem !== value) : [...current, value],
    );
  }, []);

  const resetAllFilters = React.useCallback(() => {
    setQuery("");
    setProvider("all");
    setSelectedTags([]);
    setKind("all");
    setDomain("all");
    setFreeTierType("all");
    setOverageRisk("all");
    setProductionReadiness("all");
    setDifficulty("all");
    setRequiresCard("all");
    setSortMode("best-overall");
    setTagQuery("");
  }, [
    setDifficulty,
    setDomain,
    setFreeTierType,
    setKind,
    setOverageRisk,
    setProductionReadiness,
    setProvider,
    setQuery,
    setRequiresCard,
    setSortMode,
  ]);

  const activeFilterCount = [
    query.trim() ? 1 : 0,
    provider !== "all" ? 1 : 0,
    selectedTags.length > 0 ? 1 : 0,
    kind !== "all" ? 1 : 0,
    domain !== "all" ? 1 : 0,
    freeTierType !== "all" ? 1 : 0,
    overageRisk !== "all" ? 1 : 0,
    productionReadiness !== "all" ? 1 : 0,
    difficulty !== "all" ? 1 : 0,
    requiresCard !== "all" ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  const hasCustomColumns = Object.entries(columnVisibility).some(
    ([key, value]) => (DEFAULT_DESKTOP_COLUMNS[key] ?? true) !== value,
  );

  const toggleExpandedRow = React.useCallback((slug: string) => {
    setExpandedRows((current) => ({
      ...current,
      [slug]: !current[slug],
    }));
  }, []);

  const resetColumns = React.useCallback(() => {
    setColumnVisibility(DEFAULT_DESKTOP_COLUMNS);
  }, []);

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
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Search className="size-4 text-muted-foreground" />
                Search and refine
              </div>
              <p className="text-sm text-muted-foreground">
                Start with broad filters, then narrow by pricing, readiness, or tags.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="h-6 px-2 text-xs font-medium">
                {filteredData.length} matches
              </Badge>
              <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
                {activeFilterCount} active filters
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetAllFilters} disabled={activeFilterCount === 0}>
                Reset all
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-3 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Browse essentials</h3>
                  <p className="text-xs text-muted-foreground">
                    Use the main controls people expect first: search, type, provider, and category.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    placeholder="Search title, tags, provider..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="md:col-span-2 xl:col-span-2"
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
                        .filter((item) => (domainCounts.get(item.value as string) ?? 0) > 0)
                        .map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {DOMAIN_LABELS[item.value as keyof typeof DOMAIN_LABELS]} ({
                              domainCounts.get(item.value as string) ?? 0
                            })
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Advanced filters</h3>
                    <p className="text-xs text-muted-foreground">
                      Narrow by billing risk, readiness, and setup effort when needed.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters((current) => !current)}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {showAdvancedFilters ? "Hide advanced" : "Show advanced"}
                    <ChevronDown className={`size-3.5 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {showAdvancedFilters ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Select value={freeTierType} onValueChange={(value) => setFreeTierType(value ?? "all")}>
                      <SelectTrigger>
                        <span className="truncate text-sm">
                          {formatSelectLabel({
                            label: "Free tier",
                            value: freeTierType,
                            total: freeTierTypeTotal,
                            valueLabel:
                              FREE_TIER_TYPE_LABELS[freeTierType as keyof typeof FREE_TIER_TYPE_LABELS],
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
                        {(productionReadinessOptions as Array<RegistryItem & { value: ProductionReadiness }>)
                          .filter((item) => (productionReadinessCounts.get(item.value) ?? 0) > 0)
                          .map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {PRODUCTION_READINESS_LABELS[
                                item.value as keyof typeof PRODUCTION_READINESS_LABELS
                              ]} ({productionReadinessCounts.get(item.value) ?? 0})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                          <SelectItem value="yes">
                            Requires card ({requiresCardCounts.get("yes") ?? 0})
                          </SelectItem>
                        )}
                        {(requiresCardCounts.get("no") ?? 0) > 0 && (
                          <SelectItem value="no">
                            No card required ({requiresCardCounts.get("no") ?? 0})
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                    Advanced filters are tucked away until needed to keep the main search flow simple.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/70 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Tag discovery</h3>
                <p className="text-xs text-muted-foreground">
                  Pick one or more tags from a single control. Selected tags are easy to review and remove.
                </p>
              </div>

              <div className="mt-3 space-y-3">
                <Input
                  placeholder="Search tags..."
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                />

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Popular tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {featuredTagOptions.map((item) => {
                      const isActive = selectedTags.includes(item.value);
                      return (
                        <Button
                          key={item.value}
                          variant={isActive ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleTag(item.value)}
                        >
                          #{item.value}
                          <span className="text-[11px] text-muted-foreground">{tagCounts.get(item.value) ?? 0}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Matching tags
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/70 bg-muted/10 p-2">
                    {visibleTagOptions.length > 0 ? (
                      visibleTagOptions.map((item) => {
                        const isActive = selectedTags.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleTag(item.value)}
                            className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? "bg-secondary text-secondary-foreground"
                                : "hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <span>#{item.value}</span>
                            <span className="text-xs text-muted-foreground">{tagCounts.get(item.value) ?? 0}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-4 text-sm text-muted-foreground">No matching tags.</p>
                    )}
                  </div>
                  {tagOptions.length > 12 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllMatchingTags((current) => !current)}
                    >
                      {showAllMatchingTags ? "Show fewer tags" : "Show more matching tags"}
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Selected tags
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTags.length === 0 ? "No tag filters" : `${selectedTags.length} selected`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((selectedTag) => (
                        <Badge key={selectedTag} variant="secondary" className="h-7 gap-1.5 px-2 text-xs">
                          #{selectedTag}
                          <button
                            type="button"
                            aria-label={`Remove ${selectedTag}`}
                            onClick={() => toggleTag(selectedTag)}
                            className="rounded-full p-0.5 hover:bg-background/70"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add tags to focus the results without duplicating filters.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Results display</h3>
              <p className="text-xs text-muted-foreground">
                Keep the most important information visible first. Extra details stay available without dominating the layout.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                      .map((column) => {
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
                      })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={resetColumns} disabled={!hasCustomColumns}>
                Reset columns
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="hidden overflow-hidden rounded-xl border lg:block">
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
                  <TableHead className="w-[120px] text-right">Details</TableHead>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const entry = row.original;
                  const isExpanded = expandedRows[entry.slug] ?? false;

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                        <TableCell className="w-[120px]">
                          <Button variant="ghost" size="sm" onClick={() => toggleExpandedRow(entry.slug)}>
                            {isExpanded ? "Less" : "Details"}
                            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={row.getVisibleCells().length + 1} className="bg-muted/20">
                            <div className="grid gap-3 py-2 md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Pricing model
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  {PRICING_MODEL_LABELS[
                                    entry.pricingModel as keyof typeof PRICING_MODEL_LABELS
                                  ]}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Usefulness / Popularity
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  {entry.usefulnessScore} / {entry.popularityScore}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Card required
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  {entry.freeTierDetails.requiresCard ? "Yes" : "No"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Tags
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {entry.tags.map((entryTag) => (
                                    <Badge key={entryTag} variant="secondary" className="h-6 px-2 text-xs">
                                      #{entryTag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                    No results with the active filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {filteredData.length > 0 ? (
            filteredData.map((entry) => (
              <Card key={entry.slug} className="border-border/80 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        <Link href={entry.url} className="hover:underline">
                          {entry.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-sm">{entry.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="h-6 px-2 text-xs">
                      {KIND_LABELS[entry.kind as ContentKind]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">{entry.provider}</span>
                    <span className="rounded-full bg-muted px-2 py-1">{DOMAIN_LABELS[entry.domain]}</span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      {FREE_TIER_TYPE_LABELS[
                        (entry.freeTierDetails.freeTierType ?? "always-free") as keyof typeof FREE_TIER_TYPE_LABELS
                      ]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Billing risk
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {OVERAGE_RISK_LABELS[
                          (entry.freeTierDetails.overageRisk ?? "low") as keyof typeof OVERAGE_RISK_LABELS
                        ]}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Readiness
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {
                          PRODUCTION_READINESS_LABELS[
                            entry.productionReadiness as keyof typeof PRODUCTION_READINESS_LABELS
                          ]
                        }
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Difficulty
                      </p>
                      <p className="mt-1 text-sm font-medium capitalize text-foreground">{entry.difficulty}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Card required
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {entry.freeTierDetails.requiresCard ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.slice(0, 6).map((entryTag) => (
                      <Badge key={entryTag} variant="secondary" className="h-6 px-2 text-xs">
                        #{entryTag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No results with the active filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
