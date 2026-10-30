import { z } from "zod";

import {
  CUSTOMISATIONS,
  isValidPhone,
  OCCASIONS,
  ORDER_STAGES,
  SOURCES,
  STATUSES,
  tenDigits,
} from "../domain.js";

import { todayInIndia } from "./ids.js";

// Request bodies. Same rules and messages as the website's form validation.

export const phoneSchema = z
  .string("Enter your mobile number")
  .refine(isValidPhone, "Enter a valid 10-digit mobile number")
  .transform(tenDigits);

const dateSchema = z.string("Pick a date").regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const note = z.string().trim().max(500, "Keep the note under 500 characters");

/* ---------- Customer sign-in ---------- */

export const otpRequestSchema = z.object({ phone: phoneSchema });

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string("Enter the 6-digit code").regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const profileSchema = z.object({
  name: z.string("Enter your full name").trim().min(2, "Enter your full name").max(80),
  company: z.string("Enter your company name").trim().min(2, "Enter your company name").max(120),
  email: z.string("Enter your email").trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});

export const phoneChangeSchema = z.object({ phone: phoneSchema });

/* ---------- Enquiries ---------- */

const itemSchema = z.object({
  id: z.string().min(1),
  units: z.number("Enter the units for each gift").int("Units must be a whole number").min(1),
  variants: z.array(z.object({ label: z.string().min(1), units: z.number().int().min(1) })).optional(),
  customisations: z.array(z.enum(CUSTOMISATIONS)).optional().default([]),
});

// Total units, prices, the budget per unit and the combined customisation list are worked out
// from the gifts, so whatever a client sends for them is ignored
export const enquirySchema = profileSchema.extend({
  phone: phoneSchema,
  occasion: z.enum(OCCASIONS, "Pick an occasion"),
  deliveryDate: dateSchema.refine((d) => d > todayInIndia(), "Delivery date must be in the future"),
  products: z.array(itemSchema).min(1, "Add at least one gift").max(50, "Up to 50 gifts per enquiry"),
  message: z.string().trim().max(500, "Keep the message under 500 characters").optional().default(""),
  source: z.enum(SOURCES).optional().default("website"),
});

export type ItemInput = z.output<typeof itemSchema>;

/* ---------- Admin ---------- */

export const loginSchema = z.object({
  username: z.string("Enter the username").trim().toLowerCase().min(1, "Enter the username"),
  password: z.string("Enter the password").min(1, "Enter the password"),
});

export const statusSchema = z.object({
  status: z.enum(STATUSES, "Unknown status"),
  reason: z.string().trim().max(120).optional(),
});

export const orderDraftSchema = z.object({
  // Only the price is taken from the admin; gifts and units come from the enquiry
  items: z
    .array(z.object({ id: z.string(), unitPrice: z.number().int().positive("Every gift needs a price") }))
    .min(1),
  expectedDelivery: dateSchema.refine((d) => d >= todayInIndia(), "The delivery date can't be in the past"),
  note: note.optional().default(""),
});

export const orderChangesSchema = z.object({
  stage: z.enum(ORDER_STAGES).optional(),
  expectedDelivery: dateSchema.optional(),
  note: note.optional(),
});
