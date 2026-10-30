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
  basePrice: number; // per unit, plain
  customisationPrices: Partial<Record<Customisation, number>>; // extra per unit, for what it offers
  occasions: Occasion[];
  images: string[];
  minOrder: number;
  option?: ProductOption;
  tag?: "Bestseller" | "New" | "Eco";
  // Worked out by the API from the prices above
  customisations: Customisation[]; // what it offers, in the standard order
  priceMin: number; // plain
  priceMax: number; // with every customisation
};

export type VariantQty = { label: string; units: number };

// One gift in an enquiry, with its own sizes / colours and customisation
export type EnquiryItem = {
  id: string;
  name: string;
  units: number;
  variants?: VariantQty[];
  customisations?: Customisation[];
  listPrice?: number; // catalogue price per unit with this customisation, set by the server
};

export type EnquiryStatus = "New" | "Contacted" | "Converted" | "Lost";

export type EnquiryInput = {
  name: string;
  company: string;
  phone: string;
  email: string;
  occasion: Occasion;
  units: number;
  deliveryDate: string; // ISO date (yyyy-mm-dd)
  products: EnquiryItem[];
  customisations: Customisation[]; // everything asked for across the gifts
  message: string;
};

export const ORDER_STAGES = ["Confirmed", "In production", "Dispatched", "Delivered"] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

export type OrderItem = EnquiryItem & { unitPrice: number };

// Created by the team once the customer agrees to the quote
export type Order = {
  items: OrderItem[];
  total: number;
  expectedDelivery: string; // ISO date (yyyy-mm-dd)
  stage: OrderStage;
  stageTimes: Partial<Record<OrderStage, string>>; // when each stage was reached
  trackingNumber: string;
  note: string; // shown to the customer, e.g. courier details
  confirmedAt: string;
  updatedAt: string;
};

export type Enquiry = EnquiryInput & {
  id: string;
  source: "app" | "website";
  status: EnquiryStatus;
  createdAt: string;
  respondBy: string; // the team promises a call back by this time
  budget: BudgetBandId; // worked out by the server from the gifts
  contactedAt?: string;
  closedAt?: string;
  closedReason?: string; // e.g. "Quote not agreed"
  order?: Order;
};

// A signed-in customer. New accounts fill in name, company and email after the code
export type Customer = {
  id: string;
  phone: string;
  name: string;
  company: string;
  email: string;
  profileComplete: boolean;
  createdAt: string;
};

export type CustomerProfile = Pick<Customer, "name" | "company" | "email">;
