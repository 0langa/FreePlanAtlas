"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DOMAIN_LABELS } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { ContentKind, RegistryItem } from "@/types/content";

type SidebarNavProps = {
  className?: string;
  navTypeItems: { value: ContentKind; label: string; count: number }[];
  providerRegistry: RegistryItem[];
  domainRegistry: RegistryItem[];
  tagRegistry: RegistryItem[];
};

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function NavItem({
  href,
  active,
  children,
  secondary,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm transition-colors",
        secondary
          ? "text-muted-foreground hover:bg-accent hover:text-foreground"
          : "text-foreground hover:bg-accent",
        active && "bg-accent font-medium text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function SidebarNav({
  className,
  navTypeItems,
  providerRegistry,
  domainRegistry,
  tagRegistry,
}: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAllDomains, setShowAllDomains] = React.useState(false);
  const [showAllProviders, setShowAllProviders] = React.useState(false);
  const [showAllTags, setShowAllTags] = React.useState(false);

  const activeKind = searchParams.get("kind");
  const activeDomain = searchParams.get("domain");
  const activeProvider = searchParams.get("provider");
  const activeTag = searchParams.get("tag");

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("freetierwiki.sidebar.sections");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        showAllDomains?: boolean;
        showAllProviders?: boolean;
        showAllTags?: boolean;
      };
      setShowAllDomains(Boolean(parsed.showAllDomains));
      setShowAllProviders(Boolean(parsed.showAllProviders));
      setShowAllTags(Boolean(parsed.showAllTags));
    } catch {
      window.localStorage.removeItem("freetierwiki.sidebar.sections");
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "freetierwiki.sidebar.sections",
      JSON.stringify({ showAllDomains, showAllProviders, showAllTags }),
    );
  }, [showAllDomains, showAllProviders, showAllTags]);

  const buildCombinedHref = React.useCallback(
    (key: "kind" | "domain" | "provider" | "tag", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentValue = params.get(key);

      if (currentValue === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const queryString = params.toString();
      return queryString ? `/explorer?${queryString}` : "/explorer";
    },
    [searchParams],
  );

  const visibleDomains = showAllDomains ? domainRegistry : domainRegistry.slice(0, 8);
  const visibleProviders = showAllProviders ? providerRegistry : providerRegistry.slice(0, 8);
  const visibleTags = showAllTags ? tagRegistry : tagRegistry.slice(0, 10);

  return (
    <nav className={cn("flex h-full flex-col gap-4 overflow-y-auto pb-8", className)}>
      <NavSection title="Explore">
        <NavItem
          href="/explorer"
          active={pathname === "/explorer" && searchParams.toString().length === 0}
        >
          Universal Explorer
        </NavItem>
      </NavSection>

      <NavSection title="Content Types">
        {navTypeItems.map((item) => (
          <NavItem
            key={item.value}
            href={buildCombinedHref("kind", item.value)}
            active={activeKind === item.value}
          >
            {item.label} ({item.count})
          </NavItem>
        ))}
      </NavSection>

      <NavSection title="Categories">
        {visibleDomains.map((item) => (
          <NavItem
            key={item.value}
            href={buildCombinedHref("domain", item.value)}
            active={activeDomain === item.value}
            secondary
          >
            {DOMAIN_LABELS[item.value as keyof typeof DOMAIN_LABELS]}
          </NavItem>
        ))}
        {domainRegistry.length > 12 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAllDomains((current) => !current)}>
            {showAllDomains ? "Show fewer categories" : `Show all ${domainRegistry.length} categories`}
          </Button>
        ) : null}
      </NavSection>

      <NavSection title="Providers">
        {visibleProviders.map((item) => (
          <NavItem
            key={item.value}
            href={buildCombinedHref("provider", item.value)}
            active={activeProvider === item.value}
            secondary
          >
            {item.value}
          </NavItem>
        ))}
        {providerRegistry.length > 12 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAllProviders((current) => !current)}>
            {showAllProviders ? "Show fewer providers" : `Show all ${providerRegistry.length} providers`}
          </Button>
        ) : null}
      </NavSection>

      <NavSection title="Popular Tags">
        {visibleTags.map((item) => (
          <NavItem
            key={item.value}
            href={buildCombinedHref("tag", item.value)}
            active={activeTag === item.value}
            secondary
          >
            {`#${item.value}`}
          </NavItem>
        ))}
        {tagRegistry.length > 16 ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAllTags((current) => !current)}>
            {showAllTags ? "Show fewer tags" : `Show all ${tagRegistry.length} tags`}
          </Button>
        ) : null}
      </NavSection>
    </nav>
  );
}
