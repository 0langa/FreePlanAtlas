import { HeaderBar } from "@/components/layout/header-bar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { getContentData } from "@/lib/content.server";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const { navTypeItems, providerRegistry, domainRegistry, tagRegistry } = await getContentData();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar
        navTypeItems={navTypeItems}
        providerRegistry={providerRegistry}
        domainRegistry={domainRegistry}
        tagRegistry={tagRegistry}
      />
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r px-4 py-6 lg:block">
          <SidebarNav
            className="pr-2"
            navTypeItems={navTypeItems}
            providerRegistry={providerRegistry}
            domainRegistry={domainRegistry}
            tagRegistry={tagRegistry}
          />
        </aside>
        <main className="min-w-0 px-4 py-6 lg:px-8">{children}</main>
      </div>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>{`© ${year} FreeTierWiki · V2`}</p>
          <a
            href="https://github.com/0langa/FreeTierWiki"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub Repository
          </a>
        </div>
      </footer>
    </div>
  );
}
