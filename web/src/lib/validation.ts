import { z } from "zod";

import { MIN_ORDER } from "@/data/products";

// Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6-9
const PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

export const normalisePhone = (value: string) => value.replace(/[\s-]/g, "");

export const isValidPhone = (value: string) => PHONE_RE.test(normalisePhone(value));

// "+91 98765 43210"
export function formatPhone(value: string) {
  const digits = normalisePhone(value).replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value;
}

const variantSchema = z.object({ label: z.string().min(1), units: z.number().int().min(1) });

// Each gift needs 10+ units; for sizes / colours the split has to add up to the total
const itemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    units: z.number().int().min(MIN_ORDER, `Each gift needs at least ${MIN_ORDER} units`),
    variants: z.array(variantSchema).optional(),
    customisations: z.array(z.string()).optional(),
  })
  .refine(
    (item) => !item.variants || item.variants.reduce((sum, v) => sum + v.units, 0) === item.units,
    "Size quantities don't add up to the total",
  );

// Same rules and messages as the server
export const addressSchema = z.object({
  line: z
    .string()
    .trim()
    .min(5, "Enter the full delivery address")
    .max(200, "Keep the address under 200 characters"),
  city: z.string().trim().min(2, "Enter the city").max(60),
  state: z.string().trim().min(2, "Enter the state").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  company: z.string().trim().min(2, "Enter your company name"),
  phone: z
    .string()
    .transform(normalisePhone)
    .refine((v) => PHONE_RE.test(v), "Enter a valid 10-digit mobile number"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  // The names come from the API, which checks the occasion is a real one
  occasion: z.string("Pick an occasion").min(1, "Pick an occasion"),
  units: z.coerce
    .number("Enter the number of units")
    .int("Units must be a whole number")
    .min(MIN_ORDER, `Minimum order is ${MIN_ORDER} units`)
    .max(100000, "For orders above 1,00,000 units, chat with us"),
  deliveryDate: z
    .string("Pick a delivery date")
    .min(1, "Pick a delivery date")
    .refine((v) => new Date(v).getTime() > Date.now(), "Delivery date must be in the future"),
  address: addressSchema,
  products: z.array(itemSchema).min(1, "Add at least one gift"),
  customisations: z.array(z.string()),
  message: z.string().trim().max(500, "Keep the message under 500 characters"),
});

export type EnquiryFormValues = z.input<typeof enquirySchema>;
export type AddressField = keyof z.input<typeof addressSchema>;
// Address fields are keyed "address.line", "address.pincode"…, like the server's errors
export type EnquiryFormField = keyof EnquiryFormValues | `address.${AddressField}`;
export type EnquiryFormErrors = Partial<Record<EnquiryFormField, string>>;

export function validateEnquiry(values: EnquiryFormValues) {
  const result = enquirySchema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} as EnquiryFormErrors };

  const errors: EnquiryFormErrors = {};
  for (const issue of result.error.issues) {
    const key = fieldKey(issue.path.map(String));
    if (!errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}

// "address.pincode" stays as it is; "products.0.units" belongs to the gift list as a whole
export const fieldKey = (path: string[]) =>
  (path[0] === "address" && path[1] ? `address.${path[1]}` : path[0]) as EnquiryFormField;
