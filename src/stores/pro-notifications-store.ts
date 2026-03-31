import { create } from "zustand";

interface ProNotificationsState {
  pendingCount: number;
  setPendingCount: (n: number) => void;
  incrementPendingCount: () => void;
  decrementPendingCount: () => void;
}

export const useProNotificationsStore = create<ProNotificationsState>(
  (set) => ({
    pendingCount: 0,
    setPendingCount: (n) => set({ pendingCount: n }),
    incrementPendingCount: () =>
      set((s) => ({ pendingCount: s.pendingCount + 1 })),
    decrementPendingCount: () =>
      set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),
  })
);
