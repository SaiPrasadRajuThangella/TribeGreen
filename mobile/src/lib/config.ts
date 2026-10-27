// When EXPO_PUBLIC_API_URL is empty the app runs fully on local mock data
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const USE_MOCK = API_URL.length === 0;

// Sales team WhatsApp number in international format, without "+"
export const WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? "919876543210";
