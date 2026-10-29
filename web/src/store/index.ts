import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type Choice, toggleIn } from "@/lib/items";
import type { EnquiryFormValues } from "@/lib/validation";
import type { Customer, Customisation, Enquiry } from "@/types";

/* ---------- Enquiry list: products the visitor wants a quote for ---------- */

export type ListItem = Choice & { productId: string };

type ListState = {
  items: ListItem[];
  open: boolean; // the slide-over drawer
  editing: string | null; // product whose sizes / colours are being picked
  removing: string | null; // product waiting for "Are you sure?"
  put: (productId: string, choice: Choice) => void; // add, or replace quantity and customisation
  remove: (productId: string) => void;
  setUnits: (productId: string, units: number) => void;
  toggleCustomisation: (productId: string, c: Customisation) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setEditing: (productId: string | null) => void;
  askRemove: (productId: string | null) => void;
};

export const useEnquiryList = create<ListState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      editing: null,
      removing: null,
      put: (productId, choice) =>
        set((s) => {
          const item = { productId, ...choice };
          return s.items.some((i) => i.productId === productId)
            ? { items: s.items.map((i) => (i.productId === productId ? item : i)) }
            : { items: [...s.items, item] };
        }),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId), removing: null })),
      setUnits: (productId, units) =>
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, units: Math.max(1, units) } : i)),
        })),
      toggleCustomisation: (productId, c) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, customisations: toggleIn(i.customisations, c) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
      setEditing: (editing) => set({ editing }),
      askRemove: (removing) => set({ removing }),
    }),
    {
      name: "tg-enquiry-list",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

/* ---------- Enquiry form draft: kept while the visitor adds more gifts ---------- */

export type EnquiryDraft = Partial<Omit<EnquiryFormValues, "products" | "units">>;

type DraftState = {
  draft: EnquiryDraft;
  setField: <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) => void;
  clear: () => void;
};

export const useEnquiryDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: {},
      setField: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
      clear: () => set({ draft: {} }),
    }),
    { name: "tg-enquiry-draft", storage: createJSONStorage(() => localStorage) },
  ),
);

/* ---------- Signed-in customer ---------- */

type CustomerState = {
  token: string | null;
  user: Customer | null;
  setSession: (token: string, user: Customer) => void;
  setUser: (user: Customer) => void;
  signOut: () => void;
};

export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      signOut: () => {
        set({ token: null, user: null });
        // Their details and orders shouldn't stay on a shared computer
        useEnquiryDraft.getState().clear();
        useMyOrders.getState().reset();
      },
    }),
    { name: "tg-customer", storage: createJSONStorage(() => localStorage) },
  ),
);

export const isSignedIn = (s: Pick<CustomerState, "token" | "user">) =>
  !!s.token && !!s.user?.profileComplete;

/* ---------- The customer's enquiries and orders, shared by My orders and the details page ---------- */

type MyOrdersState = {
  enquiries: Enquiry[] | null; // null until the first load
  error: string | null;
  setAll: (enquiries: Enquiry[]) => void;
  replace: (enquiry: Enquiry) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useMyOrders = create<MyOrdersState>()((set) => ({
  enquiries: null,
  error: null,
  setAll: (enquiries) => set({ enquiries, error: null }),
  replace: (enquiry) =>
    set((s) => ({ enquiries: s.enquiries?.map((e) => (e.id === enquiry.id ? enquiry : e)) ?? [enquiry] })),
  setError: (error) => set({ error }),
  reset: () => set({ enquiries: null, error: null }),
}));

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
