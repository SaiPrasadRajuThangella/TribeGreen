import { router } from "expo-router";
import { ArrowRight, ShoppingBag } from "lucide-react-native";
import { memo, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { GestureDetector, type PanGestureActiveEvent, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { GiftRow } from "@/components/GiftRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { Button, PressableScale, Text } from "@/components/ui";
import { WhatsAppNotice } from "@/components/WhatsAppNotice";
import { formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { AnimatedView } from "@/lib/interop";
import { lineTotal, quantityProblem } from "@/lib/items";
import { isSignedIn, type ListItem, useCustomer, useEnquiryList } from "@/store";
import type { Product } from "@/types";

export default function EnquiryList() {
  const items = useEnquiryList((s) => s.items);
  const clear = useEnquiryList((s) => s.clear);
  const askRemove = useEnquiryList((s) => s.askRemove);
  const { byId, loading } = useProducts();
  const signedIn = useCustomer(isSignedIn);
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

  // Gifts are saved but the catalogue isn't on the device yet: placeholders, not "empty"
  if (rows.length === 0 && items.length > 0 && loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <ScreenHeader title="Enquiry list" />
        <View className="gap-3 px-5 pt-1">
          {items.slice(0, 4).map((i) => (
            <View key={i.productId} className="flex-row gap-3 rounded-[24px] bg-card p-2.5">
              <Skeleton width={76} height={76} radius={18} />
              <View className="flex-1 gap-2 py-1">
                <Skeleton width="70%" height={14} radius={7} />
                <Skeleton width="45%" height={12} radius={6} />
                <Skeleton width={120} height={30} radius={15} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

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
          <AnimatedView key={product.id} layout={REFLOW} exiting={FadeOut.duration(160)}>
            <SwipeToRemove id={product.id} onRemove={askRemove}>
              <GiftRow item={item} product={product} />
            </SwipeToRemove>
          </AnimatedView>
        ))}

        {/* Estimate summary */}
        <AnimatedView layout={REFLOW} className="mt-2 rounded-[28px] bg-card p-5">
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
          <WhatsAppNotice compact className="mt-2" />
          {needsAttention ? (
            <Text tone="danger" className="mt-2 text-[12px]">
              Finish choosing quantities for the marked gifts.
            </Text>
          ) : null}
          <Button
            label={signedIn ? "Continue to enquiry" : "Sign in to continue"}
            icon={ArrowRight}
            iconPosition="right"
            variant="dark"
            className="mt-4"
            onPress={() =>
              // Enquiries need an account; after signing in the form opens on its own
              signedIn
                ? router.push("/enquiry")
                : router.push({ pathname: "/login", params: { next: "/enquiry" } })
            }
          />
        </AnimatedView>
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

// Cards below a removed gift move up into its place
const REFLOW = LinearTransition.duration(220);

// Dragged this far left, or flicked left, the card asks to be removed
const SWIPE_DISTANCE = 96;
const SWIPE_VELOCITY = -800;
const SNAP_BACK = { damping: 20, stiffness: 260 };

/*
 * Swiping a card left asks "Remove this gift?" (the same dialog as the bin on the card) and the
 * card springs straight back. Only the card moves: nothing sits behind it, so no second delete
 * button can show and no empty gap is left.
 */
const SwipeToRemove = memo(function SwipeToRemove({
  id,
  onRemove,
  children,
}: {
  id: string;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}) {
  const x = useSharedValue(0);

  const pan = usePanGesture(
    useMemo(
      () => ({
        activeOffsetX: [-12, 12] as [number, number], // a sideways drag starts the swipe
        failOffsetY: [-10, 10] as [number, number], // an up/down drag stays a list scroll
        onUpdate: (e: PanGestureActiveEvent) => {
          "worklet";
          x.set(Math.min(0, e.translationX));
        },
        onDeactivate: (e: PanGestureActiveEvent) => {
          "worklet";
          x.set(withSpring(0, SNAP_BACK));
          if (e.translationX < -SWIPE_DISTANCE || e.velocityX < SWIPE_VELOCITY) scheduleOnRN(onRemove, id);
        },
      }),
      [id, onRemove, x],
    ),
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    opacity: 1 + x.get() / 400,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
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
