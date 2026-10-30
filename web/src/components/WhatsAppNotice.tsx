import { MessageCircle } from "lucide-react";

// How ordering works: confirmed in a WhatsApp chat, paid in a WhatsApp group, never on the site
export function WhatsAppNotice({
  short = false,
  sent = false, // after the enquiry has gone
  className = "",
}: {
  short?: boolean;
  sent?: boolean;
  className?: string;
}) {
  if (short) {
    return (
      <p className={`flex items-start gap-2 text-xs text-muted ${className}`}>
        <MessageCircle size={14} className="mt-px shrink-0 text-whatsapp" aria-hidden />
        Orders are confirmed on WhatsApp, and payment is handled in a WhatsApp group with our team.
      </p>
    );
  }
  return (
    <div className={`flex gap-3 rounded-2xl bg-whatsapp/10 p-4 text-left ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-whatsapp text-white">
        <MessageCircle size={17} aria-hidden />
      </span>
      <div className="text-sm">
        <p className="font-bold text-ink">Orders are confirmed on WhatsApp</p>
        <p className="mt-1 leading-6 text-ink-soft">
          {sent ? "Next, our" : "After you send this enquiry, our"} team messages you on WhatsApp with the
          quote. Your order is confirmed only after that chat, and payment is handled in a WhatsApp group with
          our team. We never ask for payment on this website.
        </p>
      </div>
    </div>
  );
}
