import { router, useLocalSearchParams } from "expo-router";
import { Check, Clock, MessageCircle } from "lucide-react-native";
import { useEffect } from "react";
import { BackHandler, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomisationTags } from "@/components/orders";
import { Button, Text } from "@/components/ui";
import { formatINR, OCCASION_META } from "@/data/catalog";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { describeVariants, enquiryEstimate } from "@/lib/items";
import { formatTime } from "@/lib/time";
import { openWhatsApp } from "@/lib/whatsapp";
import { useMyOrders } from "@/store";

export default function ThankYou() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enquiry = useMyOrders((s) => s.enquiries?.find((e) => e.id === id));

  const scale = useSharedValue(0);
  const ring = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 11, stiffness: 160 });
    ring.value = withDelay(120, withSpring(1, { damping: 14, stiffness: 90 }));
  }, [ring, scale]);

  // Back on Android goes home, not back into the submitted form
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/home");
      return true;
    });
    return () => sub.remove();
  }, []);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: 2 - ring.value * 1.4,
  }));

  return (
    // SafeAreaView owns padding for the insets, so horizontal padding lives on an inner view
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-8 h-36 w-36 items-center justify-center">
            <Animated.View style={ringStyle} className="absolute h-36 w-36 rounded-full bg-lime-soft" />
            <Animated.View
              style={checkStyle}
              className="h-24 w-24 items-center justify-center rounded-full bg-lime"
            >
              <Check size={44} color="#121212" strokeWidth={2.6} />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(250).duration(500)} className="items-center">
            <Text weight="extrabold" className="mb-2 text-center text-[28px]">
              Enquiry sent!
            </Text>
            <Text tone="muted" className="text-center text-[15px] leading-6">
              Thank you{enquiry ? `, ${enquiry.name.split(" ")[0]}` : ""}. Our gifting team will call you
              {"\n"}
              with a tailored quote within {REPLY_WITHIN_HOURS} hours.
            </Text>
            {enquiry ? (
              <View className="mt-4 flex-row items-center gap-2 rounded-full bg-lime-soft px-4 py-2">
                <Clock size={15} color="#3A5512" />
                <Text weight="semibold" tone="limeInk" className="text-[13px]">
                  Expect a call by {formatTime(enquiry.respondBy)}
                </Text>
              </View>
            ) : null}
            <View className="mb-6" />
          </Animated.View>

          {enquiry ? (
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              className="w-full rounded-[28px] bg-card p-5"
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text tone="muted" className="text-[12px]">
                  Reference
                </Text>
                <Text weight="bold" className="text-[14px] tracking-wider">
                  {enquiry.id}
                </Text>
              </View>
              <View className="border-t border-line py-2.5">
                {enquiry.products.map((p) => (
                  <View key={p.id} className="flex-row justify-between gap-4 py-1">
                    <View className="flex-1">
                      <Text weight="semibold" className="text-[13px]">
                        {p.name}
                      </Text>
                      {p.variants?.length ? (
                        <Text tone="muted" className="text-[11px]">
                          {describeVariants(p.variants)}
                        </Text>
                      ) : null}
                      <CustomisationTags item={p} />
                    </View>
                    <Text weight="semibold" className="text-[13px]">
                      {p.units} units
                    </Text>
                  </View>
                ))}
              </View>
              <SummaryRow label="Occasion" value={OCCASION_META[enquiry.occasion].short} />
              {enquiryEstimate(enquiry.products) ? (
                <SummaryRow label="Estimated total" value={formatINR(enquiryEstimate(enquiry.products))} />
              ) : null}
            </Animated.View>
          ) : null}
        </View>

        <Animated.View entering={FadeInDown.delay(550).duration(500)} className="gap-3 pb-4">
          <Button
            label="Chat with us on WhatsApp"
            icon={MessageCircle}
            variant="outline"
            onPress={() =>
              openWhatsApp(`Hi Tribe Green! I just sent enquiry ${enquiry?.id ?? ""} from the app.`)
            }
          />
          <Button label="Back to home" variant="dark" onPress={() => router.replace("/home")} />
          <Button
            label="Track in My orders"
            variant="ghost"
            size="md"
            onPress={() => router.replace("/orders")}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-6 border-t border-line py-2.5">
      <Text tone="muted" className="text-[13px]">
        {label}
      </Text>
      <Text weight="semibold" numberOfLines={2} className="flex-1 text-right text-[13px]">
        {value}
      </Text>
    </View>
  );
}
