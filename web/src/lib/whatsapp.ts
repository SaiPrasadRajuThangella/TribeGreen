import { WHATSAPP_NUMBER } from "./config";

export const whatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const productWhatsAppMessage = (productName: string, url?: string) =>
  `Hi Tribe Green! I'm interested in the ${productName} for corporate gifting. Could you share pricing and customisation options?${
    url ? `\n${url}` : ""
  }`;

export const GENERAL_WHATSAPP_MESSAGE = "Hi Tribe Green! I'd like help choosing corporate gifts.";
