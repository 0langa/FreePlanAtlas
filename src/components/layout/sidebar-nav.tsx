"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { ContentKind, RegistryItem } from "@/types/content";

type SidebarNavProps = {
  className?: string;
  navTypeItems: { value: ContentKind; label: string; count: number }[];
  providerRegistry: RegistryItem[];
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
    <section className="flex flex-col gap-2">
      <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function SidebarNav({
  className,
  navTypeItems,
  providerRegistry,
  tagRegistry,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex h-full flex-col gap-6 overflow-y-auto pb-8", className)}>
      <NavSection title="Explore">
        <Link
          href="/explorer"
          className={cn(
            "rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
            pathname === "/explorer" && "bg-accent font-medium",
          )}
        >
          Universal Explorer
        </Link>
      </NavSection>

      <NavSection title="Content Types">
        {navTypeItems.map((item) => (
          <Link
            key={item.value}
            href={`/explorer?kind=${item.value}`}
            className="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            {item.label} ({item.count})
          </Link>
        ))}
      </NavSection>

      <NavSection title="Providers">
        {providerRegistry.slice(0, 12).map((item) => (
          <Link
            key={item.value}
            href={`/explorer?provider=${encodeURIComponent(item.value)}`}
            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.value}
          </Link>
        ))}
      </NavSection>

      <NavSection title="Popular Tags">
        {tagRegistry.slice(0, 16).map((item) => (
          <Link
            key={item.value}
            href={`/explorer?tag=${encodeURIComponent(item.value)}`}
            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            #{item.value}
          </Link>
        ))}
      </NavSection>
    </nav>
  );
}
