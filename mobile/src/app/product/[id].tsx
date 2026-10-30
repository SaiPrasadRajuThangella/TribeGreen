import { router, useLocalSearchParams } from "expo-router";
import {
  Check,
  ChevronLeft,
  Clock,
  Layers,
  type LucideIcon,
  MessageCircle,
  Package,
  Ruler,
  Send,
  Share2,
  ShoppingBag,
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

import { CustomisationPicker } from "@/components/CustomisationPicker";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { QuantityEditor } from "@/components/QuantityEditor";
import { Button, IconButton, PressableScale, Text } from "@/components/ui";
import { formatINR, formatPriceRange, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { success } from "@/lib/haptics";
import {
  type Choice,
  cleanCustomisations,
  defaultQuantity,
  lineTotal,
  priceFor,
  quantityProblem,
} from "@/lib/items";
import { openWhatsApp, productWhatsAppMessage } from "@/lib/whatsapp";
import { useEnquiryList } from "@/store";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, byId, loading } = useProducts();
  const product = byId.get(id);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * 0.5);

  const listed = useEnquiryList((s) => s.items.find((i) => i.productId === id));
  const put = useEnquiryList((s) => s.put);
  const { inList: listSet, toggle, openProduct } = useListToggle();
  const [expanded, setExpanded] = useState(false);
  const [edited, setEdited] = useState<Choice | null>(null);
  const [tried, setTried] = useState(false);

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
        {loading ? null : (
          <EmptyState
            icon={Package}
            title="Gift not found"
            body="This product may have been removed."
            actionLabel="Back to catalogue"
            onAction={() => router.back()}
          />
        )}
      </View>
    );
  }

  // What the user is editing, else what is already in their list, else a fresh start
  const choice: Choice = edited ?? listed ?? defaultQuantity(product);
  const problem = quantityProblem(product, choice);
  const inList = !!listed;
  const dirty = edited !== null;
  const optionName = product.option?.name.toLowerCase();

  const share = () =>
    Share.share({
      message: `${product.name} (${formatPriceRange(product)} per unit) from Tribe Green corporate gifting.`,
    });

  // Saves the choice to the list; false when it still needs sizes or more units
  const commit = () => {
    if (inList && !dirty) return true;
    if (problem) {
      setTried(true);
      return false;
    }
    success();
    put(product.id, {
      units: choice.units,
      variants: choice.variants,
      customisations: cleanCustomisations(product, choice.customisations),
    });
    setEdited(null);
    return true;
  };

  const handleAdd = () => {
    if (inList && !dirty) router.navigate("/list");
    else commit();
  };
  const enquireNow = () => commit() && router.push("/enquiry");

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

          <Text weight="extrabold" className="text-[24px] leading-[30px]">
            {product.name}
          </Text>
          <Text tone="muted" className="mt-1.5 text-[14px]">
            {product.shortDescription}
          </Text>
          <View className="mt-3">
            <Text weight="extrabold" className="text-[22px]">
              {formatPriceRange(product)}
              <Text tone="muted" className="text-[13px]">
                {" "}
                / unit
              </Text>
            </Text>
            <Text tone="muted" className="text-[12px]">
              {formatINR(product.priceMin)} plain · {formatINR(product.priceMax)} with every customisation
            </Text>
          </View>

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
            <QuickAction icon={Send} label="Enquire" onPress={enquireNow} />
          </View>

          {/* Key details */}
          <View className="mt-4 flex-row gap-3">
            <Detail icon={Package} label="Min. order" value={`${product.minOrder} units`} />
            {product.option ? (
              <Detail
                icon={Ruler}
                label={`${product.option.name}s`}
                value={
                  product.option.name === "Size"
                    ? `${product.option.values[0]} – ${product.option.values.at(-1)}`
                    : `${product.option.values.length} colours`
                }
              />
            ) : (
              <Detail icon={Clock} label="Lead time" value="7–10 days" />
            )}
          </View>

          {/* Quantity and customisation for this gift */}
          <View className="mt-4 rounded-[28px] bg-card p-4">
            <View className="mb-3 flex-row items-baseline justify-between">
              <Text weight="bold" className="text-[15px]">
                {product.option ? `Quantity by ${optionName}` : "Quantity"}
              </Text>
              {product.option ? (
                <Text tone="muted" className="text-[11px]">
                  Mix freely · {product.minOrder} min in total
                </Text>
              ) : null}
            </View>
            <QuantityEditor
              product={product}
              value={choice}
              onChange={(q) => setEdited({ ...choice, ...q })}
            />

            <Text weight="bold" className="mb-3 mt-5 text-[15px]">
              Customise this gift <Text tone="muted">(optional)</Text>
            </Text>
            <CustomisationPicker
              product={product}
              value={choice.customisations}
              onChange={(customisations) => setEdited({ ...choice, customisations })}
            />

            <View className="mt-4 rounded-2xl bg-canvas px-4 py-3">
              <Text tone="muted" className="text-[13px]">
                Your price{" "}
                <Text weight="bold" className="text-[13px]">
                  {formatINR(priceFor(product, choice))} / unit
                </Text>
                {choice.units ? (
                  <Text tone="muted" className="text-[13px]">
                    {" "}
                    ·{" "}
                    <Text weight="bold" className="text-[13px]">
                      {formatINR(lineTotal(product, choice))}
                    </Text>{" "}
                    for {choice.units.toLocaleString("en-IN")} units
                  </Text>
                ) : null}
              </Text>
            </View>
            {problem && (tried || choice.units > 0) ? (
              <Text tone="danger" weight="medium" className="mt-2 text-[13px]">
                {problem}
              </Text>
            ) : null}
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
        <Animated.View
          key={inList ? (dirty ? "dirty" : "in") : "out"}
          entering={FadeIn.duration(200)}
          className="flex-1"
        >
          <Button
            label={inList ? (dirty ? "Update list" : "In your list · View") : "Add to enquiry list"}
            icon={inList && !dirty ? Check : ShoppingBag}
            variant={inList && !dirty ? "dark" : "primary"}
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
