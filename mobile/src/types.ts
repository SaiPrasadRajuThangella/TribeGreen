export const CATEGORIES = ["Drinkware", "Apparel", "Work Essentials", "Wellness"] as const;
export type Category = (typeof CATEGORIES)[number];

export const OCCASIONS = [
  "Employee Onboarding",
  "Corporate Diwali Gifting",
  "New Year Gifts",
  "Client and Vendor Gifting",
  "Events and Trade Shows",
  "Employee Recognition",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const CUSTOMISATIONS = ["Logo printing", "Laser engraving", "Name personalisation"] as const;
export type Customisation = (typeof CUSTOMISATIONS)[number];

export type BudgetBandId = "under-500" | "500-1500" | "1500-3000" | "above-3000";

export type BudgetBand = {
  id: BudgetBandId;
  label: string;
  min: number;
  max: number;
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  shortDescription: string;
  description: string;
  priceMin: number;
  priceMax: number;
  occasions: Occasion[];
  customisations: Customisation[];
  images: string[];
  minOrder: number;
  tag?: "Bestseller" | "New" | "Eco";
};

export type EnquiryStatus = "New" | "Contacted" | "Converted" | "Lost";

export type EnquiryInput = {
  name: string;
  company: string;
  phone: string;
  email: string;
  occasion: Occasion;
  units: number;
  budget: BudgetBandId;
  deliveryDate: string; // ISO date (yyyy-mm-dd)
  products: { id: string; name: string }[];
  customisations: Customisation[];
  message: string;
};

export type Enquiry = EnquiryInput & {
  id: string;
  source: "app" | "website";
  status: EnquiryStatus;
  createdAt: string;
};
