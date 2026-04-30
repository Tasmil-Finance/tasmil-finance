import { create } from "zustand";

type SidebarTab = "history" | "positions";

interface RightSidebarTabState {
  tab: SidebarTab;
  setTab: (tab: SidebarTab) => void;
}

export const useRightSidebarTab = create<RightSidebarTabState>((set) => ({
  tab: "history",
  setTab: (tab) => set({ tab }),
}));
