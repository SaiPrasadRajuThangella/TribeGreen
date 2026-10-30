import { router } from "expo-router";
import { ArrowUpRight, Gift, MessageCircle } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeInDown,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { IconButton, PressableScale, Text } from "@/components/ui";
import { BANNER_IMAGES, CATEGORY_META, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { openWhatsApp } from "@/lib/whatsapp";
import { isSignedIn, useCustomer } from "@/store";
import { CATEGORIES, type Occasion, OCCASIONS } from "@/types";

type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  cta: string;
  image: string;
  occasion: Occasion;
  bg: string;
};

const BANNERS: Banner[] = [
  {
    id: "diwali",
    eyebrow: "Festive 2026",
    title: "Diwali hampers\nfrom ₹790",
    cta: "Explore",
    image: BANNER_IMAGES.diwali,
    occasion: "Corporate Diwali Gifting",
    bg: "#C8E98A",
  },
  {
    id: "onboarding",
    eyebrow: "New joiners",
    title: "Welcome kits\nthey'll unbox twice",
    cta: "Build a kit",
    image: BANNER_IMAGES.onboarding,
    occasion: "Employee Onboarding",
    bg: "#E9E2D6",
  },
];

const GAP = 12;

export default function Home() {
  const { width } = useWindowDimensions();
  const bannerWidth = width - 40;
  const { products } = useProducts();
  const { inList, toggle, openProduct } = useListToggle();
  const scrollX = useSharedValue(0);

  const onBannerScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x / (bannerWidth + GAP);
  });

  const bestsellers = useMemo(
    () => products.filter((p) => p.tag === "Bestseller" || p.tag === "Eco"),
    [products],
  );
  const newArrivals = useMemo(() => products.filter((p) => p.tag === "New"), [products]);

  const goCatalogue = useCallback((params?: Record<string, string>) => {
    router.navigate({ pathname: "/catalogue", params });
  }, []);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink">
              <Gift size={20} color="#C8E98A" strokeWidth={2.2} />
            </View>
            <View>
              <Text weight="extrabold" className="text-[17px]">
                Tribe Green
              </Text>
              <Text tone="muted" className="text-[12px]">
                Corporate gifting studio
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <IconButton
              icon={MessageCircle}
              label="Chat with us on WhatsApp"
              onPress={() => openWhatsApp("Hi Tribe Green! I'd like help choosing corporate gifts.")}
            />
            <AccountButton />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(500)} className="px-5 pb-5">
          <Text weight="extrabold" className="text-[28px] leading-[36px]">
            Gifts your team{"\n"}will actually love.
          </Text>
        </Animated.View>

        <SearchBar
          onPress={() => goCatalogue({ focus: "1" })}
          onFilterPress={() => goCatalogue({ filters: "1" })}
        />

        {/* Promo banners */}
        <Animated.ScrollView
          horizontal
          pagingEnabled={false}
          snapToInterval={bannerWidth + GAP}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onBannerScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 20, gap: GAP, paddingTop: 20 }}
        >
          {BANNERS.map((b) => (
            <BannerCard
              key={b.id}
              banner={b}
              width={bannerWidth}
              onPress={() => goCatalogue({ occasion: b.occasion })}
            />
          ))}
        </Animated.ScrollView>
        <View className="mt-3 flex-row justify-center gap-1.5">
          {BANNERS.map((b, i) => (
            <Dot key={b.id} index={i} progress={scrollX} />
          ))}
        </View>

        {/* Categories */}
        <View className="mt-7">
          <SectionHeader title="Shop by category" onAction={() => goCatalogue()} />
          <View className="flex-row justify-between px-5">
            {CATEGORIES.map((c) => {
              const { icon: Icon, tint } = CATEGORY_META[c];
              return (
                <PressableScale
                  key={c}
                  haptic
                  onPress={() => goCatalogue({ category: c })}
                  className="items-center"
                  style={{ width: (width - 40) / 4 }}
                >
                  <View
                    className="mb-2 h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: tint }}
                  >
                    <Icon size={24} color="#121212" strokeWidth={1.8} />
                  </View>
                  <Text weight="medium" numberOfLines={1} className="text-[12px]">
                    {c === "Work Essentials" ? "Work" : c}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Bestsellers */}
        <View className="mt-7">
          <SectionHeader title="Bestsellers" onAction={() => goCatalogue()} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
          >
            {bestsellers.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                width={172}
                inList={inList.has(p.id)}
                onPress={openProduct}
                onToggleList={toggle}
              />
            ))}
          </ScrollView>
        </View>

        {/* Occasions */}
        <View className="mt-7">
          <SectionHeader title="Gift by occasion" />
          <View className="flex-row flex-wrap px-5" style={{ gap: GAP }}>
            {OCCASIONS.map((o) => {
              const { icon: Icon, short } = OCCASION_META[o];
              return (
                <PressableScale
                  key={o}
                  haptic
                  onPress={() => goCatalogue({ occasion: o })}
                  className="flex-row items-center gap-3 rounded-[22px] bg-card p-3"
                  style={{ width: (width - 40 - GAP) / 2 }}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-lime-soft">
                    <Icon size={18} color="#3A5512" strokeWidth={2} />
                  </View>
                  <Text weight="semibold" numberOfLines={1} className="flex-1 text-[13px]">
                    {short}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Trust strip */}
        <View className="mx-5 mt-7 flex-row rounded-[26px] bg-ink px-2 py-5">
          {[
            ["500+", "brands gifted"],
            ["48 hrs", "quote turnaround"],
            ["Pan-India", "doorstep delivery"],
          ].map(([value, label]) => (
            <View key={label} className="flex-1 items-center">
              <Text weight="extrabold" tone="lime" className="text-[17px]">
                {value}
              </Text>
              <Text tone="faint" className="mt-0.5 text-center text-[11px]">
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* New arrivals */}
        {newArrivals.length > 0 ? (
          <View className="mt-7">
            <SectionHeader title="New arrivals" onAction={() => goCatalogue()} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
            >
              {newArrivals.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  width={172}
                  inList={inList.has(p.id)}
                  onPress={openProduct}
                  onToggleList={toggle}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const BannerCard = memo(function BannerCard({
  banner,
  width,
  onPress,
}: {
  banner: Banner;
  width: number;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={onPress}
      style={{ width, backgroundColor: banner.bg }}
      className="h-[176px] flex-row overflow-hidden rounded-[28px]"
    >
      <View className="flex-1 justify-between p-5">
        <View>
          <Text weight="semibold" tone="soft" className="mb-1 text-[12px] uppercase tracking-widest">
            {banner.eyebrow}
          </Text>
          <Text weight="extrabold" className="text-[21px] leading-[27px]">
            {banner.title}
          </Text>
        </View>
        <View className="flex-row items-center self-start rounded-full bg-card px-4 py-2">
          <Text weight="semibold" className="mr-1 text-[13px]">
            {banner.cta}
          </Text>
          <ArrowUpRight size={15} color="#121212" strokeWidth={2.2} />
        </View>
      </View>
      <ProductImage source={banner.image} className="h-full w-[44%]" />
    </PressableScale>
  );
});

const Dot = memo(function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], "clamp");
    return { width: 6 + t * 16, opacity: 0.35 + t * 0.65 };
  });
  return <Animated.View style={style} className="h-1.5 rounded-full bg-ink" />;
});

// The customer's initials (opens My orders), or Sign in
function AccountButton() {
  const user = useCustomer((s) => s.user);
  const signedIn = useCustomer(isSignedIn);
  if (!signedIn || !user) {
    return (
      <PressableScale
        haptic
        onPress={() => router.push({ pathname: "/login", params: { next: "/home" } })}
        className="h-11 items-center justify-center rounded-full bg-ink px-4"
      >
        <Text weight="semibold" tone="white" className="text-[13px]">
          Sign in
        </Text>
      </PressableScale>
    );
  }
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <PressableScale
      haptic
      onPress={() => router.navigate("/orders")}
      accessibilityLabel={`My orders, signed in as ${user.name}`}
      className="h-11 w-11 items-center justify-center rounded-full bg-ink"
    >
      <Text weight="bold" tone="lime" className="text-[14px]">
        {initials}
      </Text>
    </PressableScale>
  );
}
