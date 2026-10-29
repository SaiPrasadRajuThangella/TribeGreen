import { MessageCircle } from "lucide-react";
import { Outlet, ScrollRestoration, useMatch } from "react-router";

import { useProducts } from "@/hooks/useProducts";
import { SITE_URL } from "@/lib/config";
import { GENERAL_WHATSAPP_MESSAGE, productWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";

import { Footer } from "./Footer";
import { RemoveGiftDialog } from "./GiftRow";
import { Header } from "./Header";
import { ItemSheet } from "./ItemSheet";
import { ListDrawer } from "./ListDrawer";

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <ListDrawer />
      <ItemSheet />
      <RemoveGiftDialog />
      <ScrollRestoration />
    </div>
  );
}

// On a product page the chat opens with that product's name pre-filled
function FloatingWhatsApp() {
  const match = useMatch("/product/:id");
  const { byId } = useProducts();
  const product = match?.params.id ? byId.get(match.params.id) : undefined;
  const message = product
    ? productWhatsAppMessage(product.name, `${SITE_URL}/product/${product.id}`)
    : GENERAL_WHATSAPP_MESSAGE;
  // Product pages have their own sticky WhatsApp button on phones
  const hideOnPhone = product ? "max-sm:hidden" : "";

  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noreferrer"
      aria-label={product ? `Ask about ${product.name} on WhatsApp` : "Chat with us on WhatsApp"}
      className={`${hideOnPhone} group fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-full bg-whatsapp p-4 text-white shadow-[0_12px_30px_-10px_rgba(37,211,102,0.7)] transition duration-300 ease-spring hover:scale-105 sm:right-8 sm:bottom-8`}
    >
      <MessageCircle size={24} strokeWidth={2.2} />
      <span className="hidden max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-spring group-hover:max-w-40 sm:inline">
        Chat with us
      </span>
    </a>
  );
}
