// Where the API lives. Empty means this same site: in development Vite forwards /api to the
// backend on port 4000 (see vite.config.ts). Set it to the deployed API's address in production.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// Sales team WhatsApp number in international format, without "+"
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://tribegreen.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Tribe Green";

// The sales team promises to call back within this many hours of an enquiry
export const REPLY_WITHIN_HOURS = 2;
