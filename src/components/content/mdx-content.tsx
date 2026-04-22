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
        "prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary",
        className,
      )}
    >
      <MDXRemote source={source} />
    </article>
  );
}
