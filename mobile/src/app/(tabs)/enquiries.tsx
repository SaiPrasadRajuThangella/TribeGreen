import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { CalendarDays, ChevronDown, ClipboardList, Smartphone } from "lucide-react-native";
import { memo, useCallback, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ProductImage } from "@/components/ProductImage";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { PressableScale, Text } from "@/components/ui";
import { getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useMyEnquiries } from "@/store";
import type { Enquiry, EnquiryStatus } from "@/types";

const STATUS_STYLE: Record<EnquiryStatus, { box: string; tone: "limeInk" | "ink" | "danger" | "white" }> = {
  New: { box: "bg-lime-soft", tone: "limeInk" },
  Contacted: { box: "bg-soft", tone: "ink" },
  Converted: { box: "bg-ink", tone: "white" },
  Lost: { box: "bg-danger-soft", tone: "danger" },
};

const formatDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });

export default function MyEnquiries() {
  const enquiries = useMyEnquiries((s) => s.enquiries);
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = useCallback((id: string) => setOpenId((cur) => (cur === id ? null : id)), []);

  const renderItem = useCallback(
    ({ item }: { item: Enquiry }) => (
      <View className="px-5 pb-3">
        <EnquiryCard enquiry={item} open={openId === item.id} onToggle={toggle} />
      </View>
    ),
    [openId, toggle],
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="My enquiries"
        subtitle={enquiries.length ? `${enquiries.length} sent from this phone` : undefined}
      />
      {enquiries.length === 0 ? (
        <View className="flex-1" style={{ paddingBottom: TAB_BAR_SPACE }}>
          <EmptyState
            icon={ClipboardList}
            title="No enquiries yet"
            body="Enquiries you send from this phone are saved here so you can track them."
            actionLabel="Find a gift"
            onAction={() => router.navigate("/catalogue")}
          />
        </View>
      ) : (
        <FlashList
          data={enquiries}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          extraData={openId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: TAB_BAR_SPACE }}
          ListFooterComponent={
            <View className="flex-row items-center justify-center gap-1.5 pt-2">
              <Smartphone size={13} color="#A3A69D" />
              <Text tone="faint" className="text-[12px]">
                Saved on this phone
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const EnquiryCard = memo(function EnquiryCard({
  enquiry,
  open,
  onToggle,
}: {
  enquiry: Enquiry;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  const { byId } = useProducts();
  const status = STATUS_STYLE[enquiry.status];
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? "180deg" : "0deg", { duration: 200 }) }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20)}
      className="overflow-hidden rounded-[26px] bg-card"
    >
      <PressableScale
        scaleTo={0.985}
        onPress={() => onToggle(enquiry.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="p-4"
      >
        <View className="flex-row items-center justify-between">
          <Text weight="bold" className="text-[14px] tracking-wider">
            {enquiry.id}
          </Text>
          <View className={`rounded-full px-2.5 py-1 ${status.box}`}>
            <Text weight="semibold" tone={status.tone} className="text-[11px]">
              {enquiry.status === "New" ? "Submitted" : enquiry.status}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center">
          <View className="flex-row">
            {enquiry.products.slice(0, 3).map((p, i) => (
              <View
                key={p.id}
                className="rounded-[14px] border-2 border-card"
                style={{ marginLeft: i ? -14 : 0, zIndex: 3 - i }}
              >
                <ProductImage source={byId.get(p.id)?.images[0]} className="h-11 w-11 rounded-xl" />
              </View>
            ))}
          </View>
          <View className="ml-3 flex-1">
            <Text weight="semibold" numberOfLines={1} className="text-[14px]">
              {enquiry.products.map((p) => p.name).join(", ")}
            </Text>
            <Text tone="muted" className="mt-0.5 text-[12px]">
              {enquiry.units.toLocaleString("en-IN")} units · {OCCASION_META[enquiry.occasion].short}
            </Text>
          </View>
          <Animated.View style={chevron}>
            <ChevronDown size={18} color="#73776E" />
          </Animated.View>
        </View>

        {open ? (
          <Animated.View entering={FadeIn.duration(200)} className="mt-4 border-t border-line pt-3">
            <Detail label="Sent" value={formatDate(enquiry.createdAt, true)} />
            <Detail label="Company" value={enquiry.company} />
            <Detail label="Budget" value={`${getBudgetBand(enquiry.budget)?.label} / unit`} />
            <Detail label="Delivery by" value={formatDate(enquiry.deliveryDate)} icon />
            <Detail
              label="Customisation"
              value={enquiry.customisations.length ? enquiry.customisations.join(", ") : "None"}
            />
            {enquiry.message ? <Detail label="Message" value={enquiry.message} /> : null}
          </Animated.View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
});

function Detail({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <View className="flex-row justify-between gap-6 py-1.5">
      <Text tone="muted" className="text-[13px]">
        {label}
      </Text>
      <View className="flex-1 flex-row items-center justify-end gap-1.5">
        {icon ? <CalendarDays size={13} color="#73776E" /> : null}
        <Text weight="medium" className="text-right text-[13px]">
          {value}
        </Text>
      </View>
    </View>
  );
}
