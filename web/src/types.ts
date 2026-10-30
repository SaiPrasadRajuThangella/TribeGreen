// Category, occasion, customisation, status and order-stage names come from the API (GET /api/lists)
export type Category = string;
export type Occasion = string;
export type Customisation = string;
export type EnquiryStatus = string;
export type OrderStage = string;

// Every name list, in display order
export type Lists = {
  categories: Category[];
  occasions: Occasion[];
  customisations: Customisation[];
  statuses: EnquiryStatus[];
  orderStages: OrderStage[];
};

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

// A product as written in data files, before the worked-out fields
export type ProductData = Omit<Product, "customisations" | "priceMin" | "priceMax">;

export type VariantQty = { label: string; units: number };

// One gift in an enquiry. Products with sizes or colours list units per variant,
// and each gift carries its own customisation (logo on the bottle, names on the hoodies)
export type EnquiryItem = {
  id: string;
  name: string;
  units: number;
  variants?: VariantQty[];
  customisations?: Customisation[];
  listPrice?: number; // catalogue price per unit with this customisation, set by the server
};

// Where the gifts are delivered
export type Address = {
  line: string; // building, street, area
  city: string;
  state: string;
  pincode: string; // 6 digits
};

export type EnquiryInput = {
  name: string;
  company: string;
  phone: string;
  email: string;
  occasion: Occasion;
  units: number;
  deliveryDate: string; // ISO date (yyyy-mm-dd)
  address: Address;
  products: EnquiryItem[];
  customisations: Customisation[]; // everything asked for across the gifts
  message: string;
};

export type OrderItem = EnquiryItem & { unitPrice: number };

// Created by the admin once the customer agrees to the quote
export type Order = {
  items: OrderItem[];
  total: number;
  expectedDelivery: string; // ISO date (yyyy-mm-dd)
  stage: OrderStage;
  stageTimes: Partial<Record<OrderStage, string>>; // when each stage was reached
  trackingNumber: string; // created when the order is confirmed
  note: string; // shown to the customer, e.g. courier details
  confirmedAt: string;
  updatedAt: string;
};

// Orders move one stage at a time, forwards or back
export const nextStage = (stages: OrderStage[], stage: OrderStage, step: 1 | -1): OrderStage | undefined =>
  stages[stages.indexOf(stage) + step];

// What the admin fills in to finalise an order, and what can change afterwards
export type OrderDraft = Pick<Order, "items" | "expectedDelivery" | "note">;
export type OrderChanges = Partial<Pick<Order, "stage" | "expectedDelivery" | "note">>;

// Enquiries sent before the address was asked for don't have one
export type Enquiry = Omit<EnquiryInput, "address"> & {
  address?: Address;
  id: string;
  source: "app" | "website";
  status: EnquiryStatus;
  createdAt: string;
  respondBy: string; // the team promises a call back by this time
  budget: BudgetBandId; // the brief's "budget per unit", worked out by the server from the gifts
  contactedAt?: string; // first marked Contacted
  closedAt?: string; // marked Lost
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
