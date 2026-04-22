import { HeaderBar } from "@/components/layout/header-bar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { getContentData } from "@/lib/content.server";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const { navTypeItems, providerRegistry, tagRegistry } = await getContentData();

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar
        navTypeItems={navTypeItems}
        providerRegistry={providerRegistry}
        tagRegistry={tagRegistry}
      />
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r px-4 py-6 lg:block">
          <SidebarNav
            className="pr-2"
            navTypeItems={navTypeItems}
            providerRegistry={providerRegistry}
            tagRegistry={tagRegistry}
          />
        </aside>
        <main className="min-w-0 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
