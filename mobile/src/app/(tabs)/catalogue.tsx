import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { PackageSearch, WifiOff, X } from "lucide-react-native";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, type TextInputInstance, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { EMPTY_FILTERS, FilterSheet, type Filters } from "@/components/FilterSheet";
import { ProductCard } from "@/components/ProductCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchBar } from "@/components/SearchBar";
import { ProductCardSkeleton } from "@/components/Skeleton";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { Chip, PressableScale, Text } from "@/components/ui";
import { getBudgetBand, occasionMeta } from "@/data/catalog";
import { useLists } from "@/hooks/useLists";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { activeFilterCount, filterProducts } from "@/lib/filter";
import { toggleIn } from "@/lib/items";
import type { BudgetBandId, Category, Occasion, Product } from "@/types";

type Params = {
  category?: Category;
  occasion?: Occasion;
  budget?: BudgetBandId;
  focus?: string;
  filters?: string;
};

export default function Catalogue() {
  const params = useLocalSearchParams<Params>();
  const { products, loading, error, retry } = useProducts();
  const { refreshing, onRefresh } = usePullToRefresh();
  const { categories } = useLists();
  const { inList, toggle, openProduct } = useListToggle();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Home screen links arrive as params: apply them each time they change (React's
  // "adjust state when a prop changes" pattern, without an extra effect pass)
  const linkKey = [params.category, params.occasion, params.budget, params.filters].join("|");
  const [appliedLink, setAppliedLink] = useState("");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<TextInputInstance>(null);
  const deferredQuery = useDeferredValue(query);

  if (linkKey !== appliedLink) {
    setAppliedLink(linkKey);
    if (params.category || params.occasion || params.budget) {
      setFilters({
        categories: params.category ? [params.category] : [],
        occasion: params.occasion ?? null,
        budget: params.budget ?? null,
      });
    }
    if (params.filters) setSheetOpen(true);
  }

  useEffect(() => {
    if (params.focus) setTimeout(() => searchRef.current?.focus(), 350);
  }, [params.focus]);

  const results = useMemo(
    () => filterProducts(products, filters, deferredQuery),
    [products, filters, deferredQuery],
  );
  const countFor = useCallback(
    (f: Filters) => filterProducts(products, f, deferredQuery).length,
    [products, deferredQuery],
  );

  // Categories combine like on the website: one, several, or All
  const setCategory = useCallback(
    (c: Category | null) => setFilters((f) => ({ ...f, categories: c ? toggleIn(f.categories, c) : [] })),
    [],
  );
  const applyFilters = useCallback((f: Filters) => {
    setFilters(f);
    setSheetOpen(false);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <View
        style={{
          paddingLeft: index % 2 === 0 ? 20 : 6,
          paddingRight: index % 2 === 0 ? 6 : 20,
          paddingBottom: 12,
        }}
      >
        <ProductCard
          product={item}
          inList={inList.has(item.id)}
          onPress={openProduct}
          onToggleList={toggle}
        />
      </View>
    ),
    [inList, openProduct, toggle],
  );

  const activePills = [
    filters.occasion && { key: "occasion" as const, label: occasionMeta(filters.occasion).short },
    filters.budget && { key: "budget" as const, label: getBudgetBand(filters.budget)?.label ?? "" },
  ].filter(Boolean) as { key: "occasion" | "budget"; label: string }[];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Catalogue" subtitle={`${results.length} of ${products.length} gifts`} />
      <SearchBar
        ref={searchRef}
        value={query}
        onChangeText={setQuery}
        onFilterPress={() => setSheetOpen(true)}
        filterCount={activeFilterCount(filters)}
      />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            paddingTop: 14,
            paddingBottom: activePills.length ? 8 : 14,
          }}
        >
          <Chip label="All" selected={!filters.categories.length} onPress={() => setCategory(null)} />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={filters.categories.includes(c)}
              onPress={() => setCategory(c)}
            />
          ))}
        </ScrollView>

        {activePills.length ? (
          <View className="flex-row flex-wrap gap-2 px-5 pb-3">
            {activePills.map((p) => (
              <PressableScale
                key={p.key}
                haptic
                onPress={() => setFilters((f) => ({ ...f, [p.key]: null }))}
                accessibilityLabel={`Remove ${p.label} filter`}
                className="flex-row items-center gap-1 rounded-full bg-lime-soft py-1.5 pl-3 pr-2"
              >
                <Text weight="medium" tone="limeInk" className="text-[12px]">
                  {p.label}
                </Text>
                <X size={13} color="#3A5512" strokeWidth={2.4} />
              </PressableScale>
            ))}
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="gap-3 px-5">
          {[0, 1, 2].map((row) => (
            <View key={row} className="flex-row gap-3">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : error && !products.length ? (
        <EmptyState
          icon={WifiOff}
          title="Couldn't load the catalogue"
          body={error}
          actionLabel="Try again"
          onAction={retry}
        />
      ) : (
        <FlashList
          data={results}
          numColumns={2}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          extraData={inList}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#121212" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={PackageSearch}
              title="No gifts match"
              body="Try a different search or clear a filter to see more of the catalogue."
              actionLabel="Clear filters"
              onAction={() => {
                setFilters(EMPTY_FILTERS);
                setQuery("");
              }}
            />
          }
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        value={filters}
        resultCount={countFor}
        onApply={applyFilters}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}
