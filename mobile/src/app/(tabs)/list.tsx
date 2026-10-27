import { router } from "expo-router";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { ScrollView, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ProductImage } from "@/components/ProductImage";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { Button, PressableScale, Text } from "@/components/ui";
import { formatINR, formatPriceRange } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { impact, tap } from "@/lib/haptics";
import { type ListItem, useEnquiryList } from "@/store";
import type { Product } from "@/types";

const STEP = 5;

export default function EnquiryList() {
  const items = useEnquiryList((s) => s.items);
  const setUnits = useEnquiryList((s) => s.setUnits);
  const remove = useEnquiryList((s) => s.remove);
  const clear = useEnquiryList((s) => s.clear);
  const { byId } = useProducts();

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
          min: acc.min + item.units * product.priceMin,
          max: acc.max + item.units * product.priceMax,
        }),
        { units: 0, min: 0, max: 0 },
      ),
    [rows],
  );

  const onRemove = useCallback(
    (id: string) => {
      impact();
      remove(id);
    },
    [remove],
  );

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
          <PressableScale haptic onPress={clear} hitSlop={8}>
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
            <ListRow product={product} units={item.units} onUnits={setUnits} onRemove={onRemove} />
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
          <View className="flex-row items-end justify-between">
            <View>
              <Text tone="muted" className="text-[12px]">
                Estimated budget
              </Text>
              <Text weight="extrabold" className="mt-0.5 text-[20px]">
                {formatINR(totals.min)}
              </Text>
            </View>
            <Text tone="muted" className="mb-0.5 text-[12px]">
              up to {formatINR(totals.max)}
            </Text>
          </View>
          <Text tone="faint" className="mt-2 text-[11px] leading-4">
            Final pricing depends on customisation and quantity. Our team will confirm within 48 hours.
          </Text>
          <Button
            label="Continue to enquiry"
            icon={ArrowRight}
            variant="dark"
            className="mt-4"
            onPress={() => router.push("/enquiry")}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ListRow = memo(function ListRow({
  product,
  units,
  onUnits,
  onRemove,
}: {
  product: Product;
  units: number;
  onUnits: (id: string, units: number) => void;
  onRemove: (id: string) => void;
}) {
  const renderRightActions = useCallback(
    () => (
      <PressableScale
        onPress={() => onRemove(product.id)}
        accessibilityLabel={`Remove ${product.name}`}
        className="ml-3 w-20 items-center justify-center rounded-[24px] bg-danger-soft"
      >
        <Trash2 size={22} color="#E5484D" strokeWidth={2} />
      </PressableScale>
    ),
    [onRemove, product.id, product.name],
  );

  const change = (delta: number) => {
    tap();
    onUnits(product.id, Math.max(product.minOrder, units + delta));
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <PressableScale
        scaleTo={0.98}
        onPress={() => router.push(`/product/${product.id}`)}
        className="flex-row items-center gap-3 rounded-[24px] bg-card p-2.5"
      >
        <ProductImage source={product.images[0]} className="h-[84px] w-[84px] rounded-[18px]" />
        <View className="flex-1 py-1 pr-1">
          <Text weight="semibold" numberOfLines={1} className="text-[14px]">
            {product.name}
          </Text>
          <Text tone="muted" className="mt-0.5 text-[12px]">
            {formatPriceRange(product)} / unit
          </Text>
          <View className="mt-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-soft p-1">
              <StepButton icon="minus" disabled={units <= product.minOrder} onPress={() => change(-STEP)} />
              <Text weight="bold" className="min-w-[44px] text-center text-[14px]">
                {units}
              </Text>
              <StepButton icon="plus" onPress={() => change(STEP)} />
            </View>
            <Text tone="faint" className="text-[11px]">
              units
            </Text>
          </View>
        </View>
      </PressableScale>
    </ReanimatedSwipeable>
  );
});

function StepButton({
  icon,
  onPress,
  disabled,
}: {
  icon: "plus" | "minus";
  onPress: () => void;
  disabled?: boolean;
}) {
  const Icon = icon === "plus" ? Plus : Minus;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={icon === "plus" ? "Increase units" : "Decrease units"}
      className={`h-7 w-7 items-center justify-center rounded-full bg-card ${disabled ? "opacity-40" : ""}`}
    >
      <Icon size={14} color="#121212" strokeWidth={2.4} />
    </PressableScale>
  );
}

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
