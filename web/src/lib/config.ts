// When VITE_API_URL is empty the site runs on mock data stored in this browser
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const USE_MOCK = API_URL.length === 0;

// Sales team WhatsApp number in international format, without "+"
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://tribegreen.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Tribe Green";
