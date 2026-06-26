import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    { name: 'fitfoyo-ui', partialize: (s) => ({ collapsed: s.collapsed }) },
  ),
);
