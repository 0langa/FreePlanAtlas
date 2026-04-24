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
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(KIND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={provider} onValueChange={(value) => setProvider(value ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providerOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={domain} onValueChange={(value) => setDomain(value ?? "all")}> 
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {domainOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {DOMAIN_LABELS[item.value as keyof typeof DOMAIN_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={tag} onValueChange={(value) => setTag(value ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Primary tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tagOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={freeTierType} onValueChange={(value) => setFreeTierType(value ?? "all")}> 
            <SelectTrigger>
              <SelectValue placeholder="Free tier type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {freeTierTypeOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {FREE_TIER_TYPE_LABELS[item.value as keyof typeof FREE_TIER_TYPE_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={overageRisk} onValueChange={(value) => setOverageRisk(value ?? "all")}> 
            <SelectTrigger>
              <SelectValue placeholder="Overage risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {overageRiskOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {OVERAGE_RISK_LABELS[item.value as keyof typeof OVERAGE_RISK_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={productionReadiness}
            onValueChange={(value) => setProductionReadiness(value ?? "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Production readiness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All readiness levels</SelectItem>
              {productionReadinessOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {PRODUCTION_READINESS_LABELS[item.value as keyof typeof PRODUCTION_READINESS_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={difficulty} onValueChange={(value) => setDifficulty(value ?? "all")}> 
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty</SelectItem>
              {(["beginner", "intermediate", "advanced"] as FilterDifficulty[]).map((level) => (
                <SelectItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={requiresCard} onValueChange={(value) => setRequiresCard(value ?? "all")}> 
            <SelectTrigger>
              <SelectValue placeholder="Requires card" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All card requirements</SelectItem>
              <SelectItem value="yes">Requires card</SelectItem>
              <SelectItem value="no">No card required</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(value) => setSortMode(value ?? "best-overall")}> 
            <SelectTrigger>
              <SelectValue placeholder="Ranking" />
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
          <p className="text-xs text-muted-foreground">Tag filter set:</p>
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
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
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
