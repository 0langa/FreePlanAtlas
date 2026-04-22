import { notFound } from "next/navigation";

import { ContentPage } from "@/components/content/content-page";
import { isContentKind } from "@/lib/content";
import { getAllEntries, getEntryByPath, getEntryWithBodyByPath } from "@/lib/content.server";
import type { ContentKind } from "@/types/content";

type DynamicContentPageProps = {
  params: Promise<{
    kind?: string | string[];
    slug?: string | string[];
  }>;
};

export async function generateStaticParams() {
  const allEntries = await getAllEntries();
  return allEntries.map((entry) => ({
    kind: entry.kind,
    slug: entry.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: DynamicContentPageProps) {
  const resolvedParams = await params;

  const kindParam = Array.isArray(resolvedParams.kind)
    ? resolvedParams.kind[0]
    : resolvedParams.kind;
  const slugParam = resolvedParams.slug
    ? Array.isArray(resolvedParams.slug)
      ? resolvedParams.slug
      : [resolvedParams.slug]
    : [];

  if (!kindParam || !isContentKind(kindParam)) {
    return {};
  }

  if (slugParam.length === 0) {
    return {};
  }

  const entry = await getEntryByPath(kindParam, slugParam.join("/"));
  if (!entry) {
    return {};
  }

  return {
    title: `${entry.title} | FreeTierAtlas`,
    description: entry.description,
  };
}

export default async function DynamicContentPage({ params }: DynamicContentPageProps) {
  const resolvedParams = await params;

  const kindParam = Array.isArray(resolvedParams.kind)
    ? resolvedParams.kind[0]
    : resolvedParams.kind;
  const slugParam = resolvedParams.slug
    ? Array.isArray(resolvedParams.slug)
      ? resolvedParams.slug
      : [resolvedParams.slug]
    : [];

  if (!kindParam || !isContentKind(kindParam) || slugParam.length === 0) {
    notFound();
  }

  const kind = kindParam as ContentKind;
  const slug = slugParam.join("/");

  const entry = await getEntryWithBodyByPath(kind, slug);
  if (!entry) {
    notFound();
  }

  return <ContentPage entry={entry} kind={kind} />;
}
