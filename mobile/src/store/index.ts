import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Enquiry } from "@/types";

const storage = createJSONStorage(() => AsyncStorage);

/* ---------- Enquiry list: products the user wants a quote for ---------- */

export type ListItem = { productId: string; units: number };

type ListState = {
  items: ListItem[];
  add: (productId: string, units: number) => void;
  remove: (productId: string) => void;
  setUnits: (productId: string, units: number) => void;
  clear: () => void;
};

export const useEnquiryList = create<ListState>()(
  persist(
    (set) => ({
      items: [],
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
    }),
    { name: "tg-enquiry-list", storage },
  ),
);

/* ---------- My enquiries: saved on the phone after submit ---------- */

type EnquiriesState = {
  enquiries: Enquiry[];
  save: (enquiry: Enquiry) => void;
};

export const useMyEnquiries = create<EnquiriesState>()(
  persist(
    (set) => ({
      enquiries: [],
      save: (enquiry) => set((s) => ({ enquiries: [enquiry, ...s.enquiries] })),
    }),
    { name: "tg-my-enquiries", storage },
  ),
);

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
