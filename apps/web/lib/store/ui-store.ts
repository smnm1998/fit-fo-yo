import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'split' | 'month';

type UiState = {
  collapsed: boolean;
  mobileOpen: boolean;
  viewMode: ViewMode;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      viewMode: 'split',
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'fitfoyo-ui',
      partialize: (s) => ({ collapsed: s.collapsed, viewMode: s.viewMode }),
    },
  ),
);
