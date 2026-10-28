import {
  Briefcase,
  Coffee,
  Flame,
  Handshake,
  Leaf,
  type LucideIcon,
  PartyPopper,
  Presentation,
  Shirt,
  Trophy,
  UserPlus,
} from "lucide-react";

import type { BudgetBand, Category, Occasion, Product } from "@/types";

export const BUDGET_BANDS: BudgetBand[] = [
  { id: "under-500", label: "Under ₹500", min: 0, max: 499 },
  { id: "500-1500", label: "₹500 to ₹1,500", min: 500, max: 1500 },
  { id: "1500-3000", label: "₹1,500 to ₹3,000", min: 1500, max: 3000 },
  { id: "above-3000", label: "Above ₹3,000", min: 3001, max: Infinity },
];

export const getBudgetBand = (id: string) => BUDGET_BANDS.find((b) => b.id === id);

// A product fits a budget band when its price range overlaps the band
export const fitsBudget = (product: Product, band: BudgetBand) =>
  product.priceMin <= band.max && product.priceMax >= band.min;

export const CATEGORY_META: Record<Category, { icon: LucideIcon; tint: string }> = {
  Drinkware: { icon: Coffee, tint: "#E8F5D0" },
  Apparel: { icon: Shirt, tint: "#F4EADF" },
  "Work Essentials": { icon: Briefcase, tint: "#E2EBF4" },
  Wellness: { icon: Leaf, tint: "#ECE5F2" },
};

export const OCCASION_META: Record<Occasion, { short: string; icon: LucideIcon }> = {
  "Employee Onboarding": { short: "Onboarding", icon: UserPlus },
  "Corporate Diwali Gifting": { short: "Diwali", icon: Flame },
  "New Year Gifts": { short: "New Year", icon: PartyPopper },
  "Client and Vendor Gifting": { short: "Clients", icon: Handshake },
  "Events and Trade Shows": { short: "Events", icon: Presentation },
  "Employee Recognition": { short: "Recognition", icon: Trophy },
};

export const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export const formatPriceRange = (p: Pick<Product, "priceMin" | "priceMax">) =>
  `${formatINR(p.priceMin)} – ${formatINR(p.priceMax)}`;

export const COLOUR_SWATCH: Record<string, string> = {
  Black: "#1C1C1C",
  White: "#F7F7F4",
  Sage: "#9CAF88",
  Navy: "#1F2A44",
  Beige: "#D9C7A7",
  Lavender: "#B9A7D6",
  Charcoal: "#3D3F42",
};
