"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import FlexSearch from "flexsearch";

import { Input } from "@/components/ui/input";
import { DOMAIN_LABELS } from "@/lib/content";
import type { SearchRecord } from "@/types/content";
import searchRecords from "@/generated/search-index.json";

type SearchResult = Pick<SearchRecord, "id" | "title" | "url" | "provider" | "kind" | "domain">;

const searchIndex = new FlexSearch.Document<SearchRecord>({
  tokenize: "forward",
  context: true,
  document: {
    id: "id",
    index: ["title", "tags", "description", "content", "domain", "bestFor"],
    store: ["id", "title", "url", "provider", "kind", "domain"],
  },
});

for (const record of searchRecords as SearchRecord[]) {
  searchIndex.add(record);
}

function getSearchResults(query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const buckets = searchIndex.search(query, { enrich: true, limit: 6 });
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const bucket of buckets) {
    if (!bucket.result) {
      continue;
    }

    for (const row of bucket.result as Array<{ doc: SearchResult }>) {
      if (!row.doc?.id || seen.has(row.doc.id)) {
        continue;
      }
      seen.add(row.doc.id);
      results.push(row.doc);
    }
  }

  return results;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const results = React.useMemo(() => getSearchResults(query), [query]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            router.push(`/explorer?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
        }}
        placeholder="Search free-tier docs, guides, tags..."
        className="pl-9"
      />

      {isOpen && query.trim().length > 1 ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border bg-card shadow-md">
          <div className="max-h-80 overflow-y-auto p-1">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No direct matches. Press Enter for full explorer search.</p>
            ) : (
              results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  className="flex flex-col rounded-sm px-3 py-2 transition-colors hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-sm font-medium">{result.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.provider} · {DOMAIN_LABELS[result.domain ?? "other"]} · {result.kind}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}