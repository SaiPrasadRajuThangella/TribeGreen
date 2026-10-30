import Constants from "expo-constants";
import { Platform } from "react-native";

/*
 * Where the backend lives. EXPO_PUBLIC_API_URL wins (set it to the deployed API).
 * In development it is the computer running `npx expo start`, port 4000: Expo knows that
 * computer's address on the Wi-Fi, so a phone with Expo Go reaches the API without setup.
 */
function devApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:4000`;
  return Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || devApiUrl()).replace(/\/$/, "");

// Sales team WhatsApp number in international format, without "+"
export const WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? "919876543210";

// The sales team promises to call back within this many hours of an enquiry
export const REPLY_WITHIN_HOURS = 2;
