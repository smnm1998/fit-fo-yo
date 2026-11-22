import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: 'fitfoyo-ui', partialize: (s) => ({ collapsed: s.collapsed }) },
  ),
);
