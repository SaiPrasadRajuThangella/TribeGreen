import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type Choice, toggleIn } from "@/lib/items";
import type { EnquiryFormValues } from "@/lib/validation";
import type { Customer, Customisation, Enquiry } from "@/types";

const storage = createJSONStorage(() => AsyncStorage);

/* ---------- Enquiry list: gifts the user wants a quote for ---------- */

export type ListItem = Choice & { productId: string };

type ListState = {
  items: ListItem[];
  editing: string | null; // product whose sizes / colours / customisation are being picked
  removing: string | null; // product waiting for "Are you sure?"
  put: (productId: string, choice: Choice) => void; // add, or replace quantity and customisation
  remove: (productId: string) => void;
  setUnits: (productId: string, units: number) => void;
  toggleCustomisation: (productId: string, c: Customisation) => void;
  clear: () => void;
  setEditing: (productId: string | null) => void;
  askRemove: (productId: string | null) => void;
};

export const useEnquiryList = create<ListState>()(
  persist(
    (set) => ({
      items: [],
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
      setEditing: (editing) => set({ editing }),
      askRemove: (removing) => set({ removing }),
    }),
    { name: "tg-enquiry-list-v2", storage, partialize: (s) => ({ items: s.items }) },
  ),
);

/* ---------- Enquiry form draft: kept while the user adds more gifts or signs in ---------- */

export type EnquiryDraft = Partial<Omit<EnquiryFormValues, "products" | "units" | "customisations">>;

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
    { name: "tg-enquiry-draft", storage },
  ),
);

/* ---------- Signed-in customer (same account as the website) ---------- */

type CustomerState = {
  token: string | null;
  user: Customer | null;
  hydrated: boolean;
  setSession: (token: string, user: Customer) => void;
  setUser: (user: Customer) => void;
  signOut: () => void;
};

export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      signOut: () => {
        set({ token: null, user: null });
        useEnquiryDraft.getState().clear();
        useMyOrders.getState().reset();
      },
    }),
    {
      name: "tg-customer",
      storage,
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => () => useCustomer.setState({ hydrated: true }),
    },
  ),
);

export const isSignedIn = (s: Pick<CustomerState, "token" | "user">) =>
  !!s.token && !!s.user?.profileComplete;

/* ---------- The customer's enquiries and orders, from the API ---------- */

type MyOrdersState = {
  enquiries: Enquiry[] | null; // null until the first load
  error: string | null;
  setAll: (enquiries: Enquiry[]) => void;
  upsert: (enquiry: Enquiry) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useMyOrders = create<MyOrdersState>()((set) => ({
  enquiries: null,
  error: null,
  setAll: (enquiries) => set({ enquiries, error: null }),
  upsert: (enquiry) =>
    set((s) => {
      const list = s.enquiries ?? [];
      return list.some((e) => e.id === enquiry.id)
        ? { enquiries: list.map((e) => (e.id === enquiry.id ? enquiry : e)) }
        : { enquiries: [enquiry, ...list] };
    }),
  setError: (error) => set({ error }),
  reset: () => set({ enquiries: null, error: null }),
}));

/* ---------- App preferences ---------- */

type PrefsState = {
  onboarded: boolean;
  hydrated: boolean;
  finishOnboarding: () => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      onboarded: false,
      hydrated: false,
      finishOnboarding: () => set({ onboarded: true }),
    }),
    {
      name: "tg-prefs",
      storage,
      partialize: (s) => ({ onboarded: s.onboarded }),
      onRehydrateStorage: () => () => usePrefs.setState({ hydrated: true }),
    },
  ),
);
