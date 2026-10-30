import { MessageCircle } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { Text } from "./ui";

// How ordering works, said the same way on the website: no payment in the app
const TITLE = "Orders are confirmed on WhatsApp";
const BODY =
  "our team messages you on WhatsApp with the quote. Your order is confirmed only after that chat, and payment is handled in a WhatsApp group with our team. We never ask for payment in the app.";
const SHORT = "Orders are confirmed on WhatsApp, and payment is handled in a WhatsApp group with our team.";

export const WhatsAppNotice = memo(function WhatsAppNotice({
  compact = false,
  sent = false,
  className = "",
}: {
  compact?: boolean; // one line, for tight spots
  sent?: boolean; // after the enquiry has gone
  className?: string;
}) {
  if (compact) {
    return (
      <View className={`flex-row items-start gap-2 ${className}`}>
        <MessageCircle size={14} color="#1FA855" strokeWidth={2.2} />
        <Text tone="muted" className="flex-1 text-[11px] leading-4">
          {SHORT}
        </Text>
      </View>
    );
  }
  return (
    <View className={`flex-row gap-3 rounded-[24px] border border-whatsapp/30 bg-[#EAF8EF] p-4 ${className}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-whatsapp">
        <MessageCircle size={17} color="#FFFFFF" strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <Text weight="bold" className="text-[14px]">
          {TITLE}
        </Text>
        <Text tone="soft" className="mt-1 text-[12px] leading-[18px]">
          {sent ? `Next, ${BODY}` : `After you send this enquiry, ${BODY}`}
        </Text>
      </View>
    </View>
  );
});
