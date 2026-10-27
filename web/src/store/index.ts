import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/* ---------- Enquiry list: products the visitor wants a quote for ---------- */

export type ListItem = { productId: string; units: number };

type ListState = {
  items: ListItem[];
  open: boolean; // the slide-over drawer
  add: (productId: string, units: number) => void;
  remove: (productId: string) => void;
  setUnits: (productId: string, units: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useEnquiryList = create<ListState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (productId, units) =>
        set((s) =>
          s.items.some((i) => i.productId === productId) ? s : { items: [...s.items, { productId, units }] },
        ),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setUnits: (productId, units) =>
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, units: Math.max(1, units) } : i)),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "tg-enquiry-list",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

/* ---------- Admin session ---------- */

type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
};

// sessionStorage: the admin is signed out when the tab closes
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    { name: "tg-admin", storage: createJSONStorage(() => sessionStorage) },
  ),
);
