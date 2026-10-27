import { Linking } from "react-native";

import { WHATSAPP_NUMBER } from "./config";

export function openWhatsApp(message: string) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  return Linking.openURL(url);
}

export const productWhatsAppMessage = (productName: string) =>
  `Hi Tribe Green! I'm interested in the ${productName} for corporate gifting. Could you share pricing and customisation options?`;
