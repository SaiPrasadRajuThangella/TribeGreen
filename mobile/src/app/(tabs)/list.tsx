import { router } from "expo-router";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { GiftRow } from "@/components/GiftRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { Button, PressableScale, Text } from "@/components/ui";
import { formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { lineTotal, quantityProblem } from "@/lib/items";
import { type ListItem, useEnquiryList } from "@/store";
import type { Product } from "@/types";

export default function EnquiryList() {
  const items = useEnquiryList((s) => s.items);
  const clear = useEnquiryList((s) => s.clear);
  const askRemove = useEnquiryList((s) => s.askRemove);
  const { byId } = useProducts();
  const [confirmClear, setConfirmClear] = useState(false);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: byId.get(i.productId) }))
        .filter((r): r is { item: ListItem; product: Product } => !!r.product),
    [items, byId],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, { item, product }) => ({
          units: acc.units + item.units,
          total: acc.total + lineTotal(product, item),
        }),
        { units: 0, total: 0 },
      ),
    [rows],
  );
  const needsAttention = rows.some(({ item, product }) => quantityProblem(product, item));

  if (rows.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <ScreenHeader title="Enquiry list" />
        <View className="flex-1" style={{ paddingBottom: TAB_BAR_SPACE }}>
          <EmptyState
            icon={ShoppingBag}
            title="Your list is empty"
            body="Add the gifts you like and we'll send one quote for all of them."
            actionLabel="Browse catalogue"
            onAction={() => router.navigate("/catalogue")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="Enquiry list"
        subtitle={`${rows.length} ${rows.length === 1 ? "gift" : "gifts"} · swipe left to remove`}
        right={
          <PressableScale haptic onPress={() => setConfirmClear(true)} hitSlop={8}>
            <Text weight="semibold" tone="muted" className="text-[13px]">
              Clear all
            </Text>
          </PressableScale>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: TAB_BAR_SPACE + 8,
          gap: 12,
        }}
      >
        {rows.map(({ item, product }) => (
          <Animated.View
            key={product.id}
            layout={LinearTransition.springify().damping(20)}
            exiting={FadeOut.duration(180)}
          >
            <SwipeToRemove id={product.id} name={product.name} onRemove={askRemove}>
              <GiftRow item={item} product={product} />
            </SwipeToRemove>
          </Animated.View>
        ))}

        {/* Estimate summary */}
        <Animated.View
          layout={LinearTransition.springify().damping(20)}
          className="mt-2 rounded-[28px] bg-card p-5"
        >
          <Row label="Gifts" value={`${rows.length}`} />
          <Row label="Total units" value={totals.units.toLocaleString("en-IN")} />
          <View className="my-3 h-px bg-line" />
          <Text tone="muted" className="text-[12px]">
            Estimated total
          </Text>
          <Text weight="extrabold" className="mt-0.5 text-[22px]">
            {formatINR(totals.total)}
          </Text>
          <Text tone="faint" className="mt-2 text-[11px] leading-4">
            Catalogue prices with your customisation. Our team calls you with the final quote within{" "}
            {REPLY_WITHIN_HOURS} hours.
          </Text>
          {needsAttention ? (
            <Text tone="danger" className="mt-2 text-[12px]">
              Finish choosing quantities for the marked gifts.
            </Text>
          ) : null}
          <Button
            label="Continue to enquiry"
            icon={ArrowRight}
            iconPosition="right"
            variant="dark"
            className="mt-4"
            onPress={() => router.push("/enquiry")}
          />
        </Animated.View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmClear}
        title="Clear your enquiry list?"
        body="Every gift, its quantities and customisation will be removed."
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </SafeAreaView>
  );
}

// Swiping left shows a bin; tapping it asks "Are you sure?" before removing
const SwipeToRemove = memo(function SwipeToRemove({
  id,
  name,
  onRemove,
  children,
}: {
  id: string;
  name: string;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}) {
  const renderRightActions = useCallback(
    () => (
      <PressableScale
        onPress={() => onRemove(id)}
        accessibilityLabel={`Remove ${name}`}
        className="ml-3 w-20 items-center justify-center rounded-[24px] bg-danger-soft"
      >
        <Trash2 size={22} color="#E5484D" strokeWidth={2} />
      </PressableScale>
    ),
    [onRemove, id, name],
  );

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      {children}
    </ReanimatedSwipeable>
  );
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text tone="muted" className="text-[13px]">
        {label}
      </Text>
      <Text weight="semibold" className="text-[14px]">
        {value}
      </Text>
    </View>
  );
}
