import { z } from "zod";

import { CUSTOMISATIONS, OCCASIONS } from "@/types";

// Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6-9
const PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

export const normalisePhone = (value: string) => value.replace(/[\s-]/g, "");

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  company: z.string().trim().min(2, "Enter your company name"),
  phone: z
    .string()
    .transform(normalisePhone)
    .refine((v) => PHONE_RE.test(v), "Enter a valid 10-digit mobile number"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  occasion: z.enum(OCCASIONS, "Pick an occasion"),
  units: z.coerce
    .number("Enter the number of units")
    .int("Units must be a whole number")
    .min(10, "Minimum order is 10 units")
    .max(100000, "For orders above 1,00,000 units, chat with us"),
  budget: z.enum(["under-500", "500-1500", "1500-3000", "above-3000"], "Pick a budget per unit"),
  deliveryDate: z
    .string("Pick a delivery date")
    .min(1, "Pick a delivery date")
    .refine((v) => new Date(v).getTime() > Date.now(), "Delivery date must be in the future"),
  products: z.array(z.object({ id: z.string(), name: z.string() })).min(1, "Add at least one product"),
  customisations: z.array(z.enum(CUSTOMISATIONS)),
  message: z.string().trim().max(500, "Keep the message under 500 characters"),
});

export type EnquiryFormValues = z.input<typeof enquirySchema>;
export type EnquiryFormErrors = Partial<Record<keyof EnquiryFormValues, string>>;

export function validateEnquiry(values: EnquiryFormValues) {
  const result = enquirySchema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} as EnquiryFormErrors };

  const errors: EnquiryFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof EnquiryFormValues;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}
