import { router, useLocalSearchParams } from "expo-router";
import {
  Check,
  ChevronLeft,
  Clock,
  Layers,
  type LucideIcon,
  MessageCircle,
  Package,
  PenTool,
  Send,
  Share2,
  ShoppingBag,
  Stamp,
  Type,
} from "lucide-react-native";
import { memo, useMemo, useState } from "react";
import { ScrollView, Share, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Button, IconButton, PressableScale, Text } from "@/components/ui";
import { formatPriceRange, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { success } from "@/lib/haptics";
import { openWhatsApp, productWhatsAppMessage } from "@/lib/whatsapp";
import { useEnquiryList } from "@/store";
import { type Customisation, CUSTOMISATIONS } from "@/types";

const CUSTOM_ICONS: Record<Customisation, LucideIcon> = {
  "Logo printing": Stamp,
  "Laser engraving": PenTool,
  "Name personalisation": Type,
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, byId } = useProducts();
  const product = byId.get(id);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * 0.5);

  const inList = useEnquiryList((s) => s.items.some((i) => i.productId === id));
  const addToList = useEnquiryList((s) => s.add);
  const { inList: listSet, toggle, openProduct } = useListToggle();
  const [expanded, setExpanded] = useState(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Parallax: image drifts slower than content and stretches on overscroll
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-heroHeight, 0, heroHeight],
          [-heroHeight / 2, 0, heroHeight * 0.4],
        ),
      },
      { scale: interpolate(scrollY.value, [-heroHeight, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));

  const similar = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id) : []),
    [products, product],
  );

  if (!product) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={Package}
          title="Gift not found"
          body="This product may have been removed."
          actionLabel="Back to catalogue"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const share = () =>
    Share.share({
      message: `${product.name} (${formatPriceRange(product)} per unit) from Tribe Green corporate gifting.`,
    });

  const handleAdd = () => {
    if (inList) {
      router.navigate("/list");
      return;
    }
    success();
    addToList(product.id, product.minOrder);
  };

  return (
    <View className="flex-1 bg-canvas">
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View style={[{ height: heroHeight }, heroStyle]}>
          <ProductImage source={product.images[0]} className="h-full w-full" priority="high" />
        </Animated.View>

        <View className="-mt-8 rounded-t-[32px] bg-canvas px-5 pt-6">
          <View className="mb-3 flex-row items-center gap-2">
            <View className="rounded-full bg-lime-soft px-3 py-1">
              <Text weight="semibold" tone="limeInk" className="text-[11px]">
                {product.category}
              </Text>
            </View>
            {product.tag ? (
              <View className="rounded-full bg-ink px-3 py-1">
                <Text weight="semibold" tone="white" className="text-[11px]">
                  {product.tag}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-start justify-between gap-4">
            <Text weight="extrabold" className="flex-1 text-[24px] leading-[30px]">
              {product.name}
            </Text>
            <View className="items-end">
              <Text weight="extrabold" className="text-[20px]">
                ₹{product.priceMin.toLocaleString("en-IN")}
              </Text>
              <Text tone="muted" className="text-[11px]">
                up to ₹{product.priceMax.toLocaleString("en-IN")} / unit
              </Text>
            </View>
          </View>
          <Text tone="muted" className="mt-1.5 text-[14px]">
            {product.shortDescription}
          </Text>

          {/* Quick actions */}
          <View className="mt-5 flex-row rounded-[24px] bg-card p-2">
            <QuickAction
              icon={MessageCircle}
              label="WhatsApp"
              onPress={() => openWhatsApp(productWhatsAppMessage(product.name))}
              highlight
            />
            <QuickAction icon={Share2} label="Share" onPress={share} />
            <QuickAction
              icon={Layers}
              label="Similar"
              onPress={() =>
                router.navigate({ pathname: "/catalogue", params: { category: product.category } })
              }
            />
            <QuickAction
              icon={Send}
              label="Enquire"
              onPress={() => router.push({ pathname: "/enquiry", params: { productId: product.id } })}
            />
          </View>

          {/* Key details */}
          <View className="mt-4 flex-row gap-3">
            <Detail icon={Package} label="Min. order" value={`${product.minOrder} units`} />
            <Detail icon={Clock} label="Lead time" value="7–10 days" />
          </View>

          {/* Description */}
          <Section title="About this gift">
            <Text tone="soft" numberOfLines={expanded ? undefined : 3} className="text-[14px] leading-[22px]">
              {product.description}
            </Text>
            <PressableScale onPress={() => setExpanded((v) => !v)} hitSlop={8} className="mt-1.5 self-start">
              <Text weight="semibold" className="text-[13px] underline">
                {expanded ? "Show less" : "Show more"}
              </Text>
            </PressableScale>
          </Section>

          <Section title="Perfect for">
            <View className="flex-row flex-wrap gap-2">
              {product.occasions.map((o) => {
                const { icon: Icon, short } = OCCASION_META[o];
                return (
                  <View
                    key={o}
                    className="flex-row items-center gap-1.5 rounded-full border border-line bg-card px-3 py-2"
                  >
                    <Icon size={14} color="#2B2B2B" strokeWidth={2} />
                    <Text weight="medium" className="text-[12px]">
                      {short}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="Make it yours">
            <View className="overflow-hidden rounded-[22px] bg-card">
              {CUSTOMISATIONS.map((c, i) => {
                const Icon = CUSTOM_ICONS[c];
                const available = product.customisations.includes(c);
                return (
                  <View
                    key={c}
                    className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${available ? "bg-lime-soft" : "bg-soft"}`}
                    >
                      <Icon size={16} color={available ? "#3A5512" : "#A3A69D"} strokeWidth={2} />
                    </View>
                    <Text weight="medium" tone={available ? "ink" : "faint"} className="flex-1 text-[14px]">
                      {c}
                    </Text>
                    <Text weight="medium" tone={available ? "limeInk" : "faint"} className="text-[12px]">
                      {available ? "Available" : "Not offered"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        </View>

        {similar.length > 0 ? (
          <View className="mt-7">
            <Text weight="bold" className="mb-3 px-5 text-[17px]">
              You may also like
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {similar.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  width={Math.min(172, width * 0.44)}
                  inList={listSet.has(p.id)}
                  onPress={openProduct}
                  onToggleList={toggle}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* Floating top buttons */}
      <View className="absolute inset-x-0 flex-row justify-between px-5" style={{ top: insets.top + 8 }}>
        <IconButton icon={ChevronLeft} label="Go back" onPress={() => router.back()} />
        <IconButton icon={Share2} label="Share product" onPress={share} />
      </View>

      {/* Sticky action bar */}
      <View
        className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-line bg-canvas px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <IconButton
          icon={MessageCircle}
          label="Ask on WhatsApp"
          variant="dark"
          size={56}
          iconColor="#25D366"
          onPress={() => openWhatsApp(productWhatsAppMessage(product.name))}
        />
        <Animated.View key={inList ? "in" : "out"} entering={FadeIn.duration(200)} className="flex-1">
          <Button
            label={inList ? "In your list · View" : "Add to enquiry list"}
            icon={inList ? Check : ShoppingBag}
            variant={inList ? "dark" : "primary"}
            onPress={handleAdd}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const QuickAction = memo(function QuickAction({
  icon: Icon,
  label,
  onPress,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <PressableScale
      haptic
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-1 items-center rounded-[18px] py-3 ${highlight ? "bg-ink" : ""}`}
    >
      <Icon size={20} color={highlight ? "#C8E98A" : "#121212"} strokeWidth={1.9} />
      <Text weight="medium" tone={highlight ? "white" : "soft"} className="mt-1.5 text-[11px]">
        {label}
      </Text>
    </PressableScale>
  );
});

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View className="flex-1 flex-row items-center gap-3 rounded-[20px] bg-card p-3.5">
      <Icon size={18} color="#73776E" strokeWidth={1.9} />
      <View>
        <Text tone="muted" className="text-[11px]">
          {label}
        </Text>
        <Text weight="semibold" className="text-[14px]">
          {value}
        </Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text weight="bold" className="mb-3 text-[17px]">
        {title}
      </Text>
      {children}
    </View>
  );
}
