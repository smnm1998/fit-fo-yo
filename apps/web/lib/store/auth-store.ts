import { create } from 'zustand';
import type { ApiUser } from '@/lib/types';

type AuthState = {
  user: ApiUser | null;
  setUser: (user: ApiUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
