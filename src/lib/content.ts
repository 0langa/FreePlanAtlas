import type { ContentKind } from "@/types/content";

export const KIND_LABELS: Record<ContentKind, string> = {
  services: "Services",
  tools: "Tools",
  resources: "Resources",
  guides: "Guides",
  playbooks: "Playbooks",
  comparisons: "Comparisons",
};

export const PRICING_MODEL_LABELS = {
  free: "Free",
  freemium: "Freemium",
  trial: "Trial",
} as const;

export function isContentKind(value: string): value is ContentKind {
  return ["services", "tools", "resources", "guides", "playbooks", "comparisons"].includes(
    value,
  );
}
