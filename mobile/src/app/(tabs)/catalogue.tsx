import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { PackageSearch, X } from "lucide-react-native";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, type TextInputInstance, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { EMPTY_FILTERS, FilterSheet, type Filters } from "@/components/FilterSheet";
import { ProductCard } from "@/components/ProductCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchBar } from "@/components/SearchBar";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { Chip, PressableScale, Text } from "@/components/ui";
import { getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { activeFilterCount, filterProducts } from "@/lib/filter";
import { type BudgetBandId, CATEGORIES, type Category, type Occasion, type Product } from "@/types";

type Params = {
  category?: Category;
  occasion?: Occasion;
  budget?: BudgetBandId;
  focus?: string;
  filters?: string;
};

export default function Catalogue() {
  const params = useLocalSearchParams<Params>();
  const { products, loading } = useProducts();
  const { inList, toggle, openProduct } = useListToggle();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<TextInputInstance>(null);
  const deferredQuery = useDeferredValue(query);

  // Home screen links arrive as params: apply them each time they change
  useEffect(() => {
    if (params.category || params.occasion || params.budget) {
      setFilters({
        category: params.category ?? null,
        occasion: params.occasion ?? null,
        budget: params.budget ?? null,
      });
    }
    if (params.focus) setTimeout(() => searchRef.current?.focus(), 350);
    if (params.filters) setSheetOpen(true);
  }, [params.category, params.occasion, params.budget, params.focus, params.filters]);

  const results = useMemo(
    () => filterProducts(products, filters, deferredQuery),
    [products, filters, deferredQuery],
  );
  const countFor = useCallback(
    (f: Filters) => filterProducts(products, f, deferredQuery).length,
    [products, deferredQuery],
  );

  const setCategory = useCallback(
    (c: Category | null) => setFilters((f) => ({ ...f, category: f.category === c ? null : c })),
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
    filters.occasion && { key: "occasion" as const, label: OCCASION_META[filters.occasion].short },
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
          <Chip label="All" selected={!filters.category} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={filters.category === c} onPress={() => setCategory(c)} />
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#121212" />
        </View>
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
