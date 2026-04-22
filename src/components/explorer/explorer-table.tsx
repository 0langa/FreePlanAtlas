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
import { KIND_LABELS, PRICING_MODEL_LABELS } from "@/lib/content";
import { useExplorerStore } from "@/store/explorer-store";
import type { AtlasEntry, ContentKind, RegistryItem } from "@/types/content";

type ExplorerTableProps = {
  data: AtlasEntry[];
  providerOptions: RegistryItem[];
  tagOptions: RegistryItem[];
  initialQuery: string;
  initialProvider: string;
  initialTag: string;
  initialKind: string;
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
    accessorKey: "pricingModel",
    header: "Pricing",
    cell: ({ row }) =>
      PRICING_MODEL_LABELS[row.original.pricingModel as keyof typeof PRICING_MODEL_LABELS],
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
    ...entry.tags,
    ...entry.useCases,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function ExplorerTable({
  data,
  providerOptions,
  tagOptions,
  initialQuery,
  initialProvider,
  initialTag,
  initialKind,
}: ExplorerTableProps) {
  const { query, provider, tag, kind, setQuery, setProvider, setTag, setKind, initialize } =
    useExplorerStore();

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "usefulnessScore", desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    initialize({
      query: initialQuery,
      provider: initialProvider || "all",
      tag: initialTag || "all",
      kind: initialKind || "all",
    });
  }, [initialKind, initialProvider, initialQuery, initialTag, initialize]);

  const filteredData = React.useMemo(() => {
    return data.filter((entry) => {
      if (provider !== "all" && entry.provider !== provider) {
        return false;
      }
      if (kind !== "all" && entry.kind !== kind) {
        return false;
      }
      if (tag !== "all" && !entry.tags.includes(tag)) {
        return false;
      }
      if (selectedTags.length > 0 && !selectedTags.every((selected) => entry.tags.includes(selected))) {
        return false;
      }

      return matchesQuery(entry, query);
    });
  }, [data, kind, provider, query, selectedTags, tag]);

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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
