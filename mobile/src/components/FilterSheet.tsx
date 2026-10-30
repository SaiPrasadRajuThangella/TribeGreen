import { X } from "lucide-react-native";
import { memo, useState } from "react";
import { ScrollView, View } from "react-native";

import { BUDGET_BANDS, occasionMeta } from "@/data/catalog";
import { useLists } from "@/hooks/useLists";
import { toggleIn } from "@/lib/items";
import type { BudgetBandId, Category, Occasion } from "@/types";

import { BottomSheet } from "./BottomSheet";
import { Button, Chip, IconButton, Text } from "./ui";

export type Filters = {
  categories: Category[]; // empty means all categories
  occasion: Occasion | null;
  budget: BudgetBandId | null;
};

export const EMPTY_FILTERS: Filters = { categories: [], occasion: null, budget: null };

type Props = {
  visible: boolean;
  value: Filters;
  resultCount: (f: Filters) => number;
  onApply: (f: Filters) => void;
  onClose: () => void;
};

export const FilterSheet = memo(function FilterSheet({
  visible,
  value,
  resultCount,
  onApply,
  onClose,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} closeLabel="Close filters">
      {/* Mounted on each opening, so the draft starts from the filters currently applied */}
      <SheetBody value={value} resultCount={resultCount} onApply={onApply} onClose={onClose} />
    </BottomSheet>
  );
});

function SheetBody({ value, resultCount, onApply, onClose }: Omit<Props, "visible">) {
  const [draft, setDraft] = useState<Filters>(value);
  const { categories, occasions } = useLists();

  const toggle = <K extends "occasion" | "budget">(key: K, v: Filters[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === v ? null : v }));
  // Categories combine: one, several, or none for all
  const toggleCategory = (c: Category) => setDraft((d) => ({ ...d, categories: toggleIn(d.categories, c) }));

  const count = resultCount(draft);

  return (
    <>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Text weight="bold" className="text-xl">
          Filters
        </Text>
        <IconButton icon={X} label="Close filters" onPress={onClose} size={38} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Group title="Category · pick one or more">
          <Chip
            label="All"
            selected={!draft.categories.length}
            onPress={() => setDraft((d) => ({ ...d, categories: [] }))}
          />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={draft.categories.includes(c)}
              onPress={() => toggleCategory(c)}
            />
          ))}
        </Group>
        <Group title="Occasion">
          {occasions.map((o) => (
            <Chip
              key={o}
              label={occasionMeta(o).short}
              icon={occasionMeta(o).icon}
              selected={draft.occasion === o}
              onPress={() => toggle("occasion", o)}
            />
          ))}
        </Group>
        <Group title="Budget per unit">
          {BUDGET_BANDS.map((b) => (
            <Chip
              key={b.id}
              label={b.label}
              selected={draft.budget === b.id}
              onPress={() => toggle("budget", b.id)}
            />
          ))}
        </Group>
      </ScrollView>

      <View className="flex-row gap-3 px-5 pt-3">
        <Button label="Reset" variant="outline" className="flex-1" onPress={() => setDraft(EMPTY_FILTERS)} />
        <Button
          label={count === 1 ? "Show 1 gift" : `Show ${count} gifts`}
          variant="dark"
          className="flex-1"
          onPress={() => onApply(draft)}
        />
      </View>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text weight="semibold" tone="muted" className="mb-2.5 text-[13px]">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
