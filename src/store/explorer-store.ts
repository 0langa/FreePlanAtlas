import { create } from "zustand";

type ExplorerState = {
  query: string;
  provider: string;
  tag: string;
  kind: string;
  domain: string;
  freeTierType: string;
  overageRisk: string;
  productionReadiness: string;
  difficulty: string;
  requiresCard: string;
  sortMode: string;
  setQuery: (value: string) => void;
  setProvider: (value: string) => void;
  setTag: (value: string) => void;
  setKind: (value: string) => void;
  setDomain: (value: string) => void;
  setFreeTierType: (value: string) => void;
  setOverageRisk: (value: string) => void;
  setProductionReadiness: (value: string) => void;
  setDifficulty: (value: string) => void;
  setRequiresCard: (value: string) => void;
  setSortMode: (value: string) => void;
  initialize: (state: Pick<
    ExplorerState,
    | "query"
    | "provider"
    | "tag"
    | "kind"
    | "domain"
    | "freeTierType"
    | "overageRisk"
    | "productionReadiness"
    | "difficulty"
    | "requiresCard"
    | "sortMode"
  >) => void;
};

export const useExplorerStore = create<ExplorerState>((set) => ({
  query: "",
  provider: "all",
  tag: "all",
  kind: "all",
  domain: "all",
  freeTierType: "all",
  overageRisk: "all",
  productionReadiness: "all",
  difficulty: "all",
  requiresCard: "all",
  sortMode: "best-overall",
  setQuery: (value) => set({ query: value }),
  setProvider: (value) => set({ provider: value }),
  setTag: (value) => set({ tag: value }),
  setKind: (value) => set({ kind: value }),
  setDomain: (value) => set({ domain: value }),
  setFreeTierType: (value) => set({ freeTierType: value }),
  setOverageRisk: (value) => set({ overageRisk: value }),
  setProductionReadiness: (value) => set({ productionReadiness: value }),
  setDifficulty: (value) => set({ difficulty: value }),
  setRequiresCard: (value) => set({ requiresCard: value }),
  setSortMode: (value) => set({ sortMode: value }),
  initialize: (state) => set(state),
}));