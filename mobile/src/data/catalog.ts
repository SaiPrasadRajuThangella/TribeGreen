import {
  Briefcase,
  Coffee,
  Flame,
  Handshake,
  Leaf,
  type LucideIcon,
  PartyPopper,
  PenTool,
  Presentation,
  Shirt,
  Stamp,
  Trophy,
  Type,
  UserPlus,
} from "lucide-react-native";

import type { BudgetBand, Category, Customisation, Occasion, Product } from "@/types";

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

export const CUSTOMISATION_META: Record<Customisation, { short: string; hint: string; icon: LucideIcon }> = {
  "Logo printing": { short: "Logo", hint: "Your logo printed or embroidered", icon: Stamp },
  "Laser engraving": { short: "Engraving", hint: "Logo or text etched into the surface", icon: PenTool },
  "Name personalisation": {
    short: "Names",
    hint: "Each piece carries a name. We collect the list after the quote",
    icon: Type,
  },
};

export const COLOUR_SWATCH: Record<string, string> = {
  Black: "#1C1C1C",
  White: "#F7F7F4",
  Sage: "#9CAF88",
  Navy: "#1F2A44",
  Beige: "#D9C7A7",
  Lavender: "#B9A7D6",
  Charcoal: "#3D3F42",
};

// Free Unsplash photos for the home banners and onboarding
const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=75&fm=jpg&fit=crop&auto=format`;

export const BANNER_IMAGES = {
  diwali: img("photo-1510284876186-b1a84b94418f"),
  onboarding: img("photo-1607614564906-234871d9608f"),
  hero: img("photo-1769286145156-70a40fff80ec"),
};

export const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export const formatPriceRange = (p: Pick<Product, "priceMin" | "priceMax">) =>
  `${formatINR(p.priceMin)} – ${formatINR(p.priceMax)}`;
