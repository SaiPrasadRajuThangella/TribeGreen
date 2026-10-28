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

// A product can come in sizes or colours; the buyer splits units across them (10 M + 10 L)
export type ProductOption = { name: "Size" | "Colour"; values: string[] };

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
  option?: ProductOption;
  tag?: "Bestseller" | "New" | "Eco";
};

export type VariantQty = { label: string; units: number };

// One gift in an enquiry. Products with sizes or colours list units per variant
export type EnquiryItem = {
  id: string;
  name: string;
  units: number;
  variants?: VariantQty[];
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
  products: EnquiryItem[];
  customisations: Customisation[];
  message: string;
};

export const ORDER_STAGES = ["Confirmed", "In production", "Dispatched", "Delivered"] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

export type OrderItem = EnquiryItem & { unitPrice: number };

// Created by the admin once the customer agrees to the quote
export type Order = {
  items: OrderItem[];
  total: number;
  expectedDelivery: string; // ISO date (yyyy-mm-dd)
  stage: OrderStage;
  note: string; // shown to the customer, e.g. courier and tracking number
  confirmedAt: string;
  updatedAt: string;
};

// What the admin fills in to finalise an order, and what can change afterwards
export type OrderDraft = Pick<Order, "items" | "expectedDelivery" | "note">;
export type OrderChanges = Partial<Pick<Order, "stage" | "expectedDelivery" | "note">>;

export type Enquiry = EnquiryInput & {
  id: string;
  source: "app" | "website";
  status: EnquiryStatus;
  createdAt: string;
  respondBy: string; // the team promises a call back by this time
  order?: Order;
};

// What the customer needs to look up their own enquiry
export type EnquiryRef = { id: string; phone: string };
