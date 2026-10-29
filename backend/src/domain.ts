// The fixed lists from the brief, shared by validation, models and seed data

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

export const BUDGET_BANDS = ["under-500", "500-1500", "1500-3000", "above-3000"] as const;
export type BudgetBandId = (typeof BUDGET_BANDS)[number];

export const STATUSES = ["New", "Contacted", "Converted", "Lost"] as const;
export type EnquiryStatus = (typeof STATUSES)[number];

export const ORDER_STAGES = ["Confirmed", "In production", "Dispatched", "Delivered"] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

export const SOURCES = ["website", "app"] as const;

// Every gift can be ordered from 10 units
export const MIN_ORDER = 10;

// Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6-9
const PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

export const cleanPhone = (value: string) => value.replace(/[\s-]/g, "");
export const isValidPhone = (value: string) => PHONE_RE.test(cleanPhone(value));
// Stored as the plain 10 digits
export const tenDigits = (value: string) => cleanPhone(value).replace(/\D/g, "").slice(-10);
