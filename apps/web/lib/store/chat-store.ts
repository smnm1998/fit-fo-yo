import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ChatCard = {
  kind: 'created' | 'updated' | 'removed';
  type: 'DIET' | 'EXERCISE';
  name: string;
  meal?: string | null;
  detail: string;
  estimated?: boolean;
};

export type ChatMsg = {
  id: string;
  text: string;
  status: 'pending' | 'done' | 'error';
  reply?: string;
  suggestions?: string[];
  cards?: ChatCard[];
  error?: string;
  quota?: boolean;
};

type ChatState = {
  byDate: Record<string, ChatMsg[]>;
  append: (date: string, msg: ChatMsg) => void;
  patch: (date: string, id: string, patch: Partial<ChatMsg>) => void;
  clear: (date: string) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      byDate: {},
      append: (date, msg) =>
        set((s) => ({ byDate: { ...s.byDate, [date]: [...(s.byDate[date] ?? []), msg] } })),
      patch: (date, id, p) =>
        set((s) => ({
          byDate: {
            ...s.byDate,
            [date]: (s.byDate[date] ?? []).map((m) => (m.id === id ? { ...m, ...p } : m)),
          },
        })),
      clear: (date) =>
        set((s) => {
          const next = { ...s.byDate };
          delete next[date];
          return { byDate: next };
        }),
      reset: () => set({ byDate: {} }),
    }),
    {
      name: 'fitfoyo-chat',
      storage: createJSONStorage(() => sessionStorage), // ← localStorage로 바꾸면 영구 보관
    },
  ),
);
