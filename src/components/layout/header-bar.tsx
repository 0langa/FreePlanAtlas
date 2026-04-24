"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ContentKind, RegistryItem } from "@/types/content";

export function HeaderBar({
  navTypeItems,
  providerRegistry,
  domainRegistry,
  tagRegistry,
}: {
  navTypeItems: { value: ContentKind; label: string; count: number }[];
  providerRegistry: RegistryItem[];
  domainRegistry: RegistryItem[];
  tagRegistry: RegistryItem[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden focus-visible:border-transparent focus-visible:ring-0"
                aria-label="Open menu"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="border-b px-4 py-3">
              <Link href="/" className="text-sm font-semibold tracking-wide text-muted-foreground">
                FreeTierWiki
              </Link>
            </div>
            <div className="h-[calc(100%-61px)] p-4">
              <SidebarNav
                navTypeItems={navTypeItems}
                providerRegistry={providerRegistry}
                domainRegistry={domainRegistry}
                tagRegistry={tagRegistry}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="shrink-0 text-base font-semibold tracking-tight">
          FreeTierWiki
        </Link>

        <GlobalSearch />

        <ThemeToggle />
      </div>
    </header>
  );
}
