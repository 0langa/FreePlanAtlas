import { MDXRemote } from "next-mdx-remote/rsc";

import { cn } from "@/lib/utils";

type MdxContentProps = {
  source: string;
  className?: string;
};

export function MdxContent({ source, className }: MdxContentProps) {
  return (
    <article
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-p:leading-7 prose-a:text-primary",
        className,
      )}
    >
      <MDXRemote source={source} />
    </article>
  );
}
