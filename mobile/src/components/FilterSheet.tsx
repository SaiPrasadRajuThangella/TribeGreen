import { X } from "lucide-react-native";
import { memo, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BUDGET_BANDS, OCCASION_META } from "@/data/catalog";
import { type BudgetBandId, CATEGORIES, type Category, type Occasion, OCCASIONS } from "@/types";

import { Button, Chip, IconButton, Text } from "./ui";

export type Filters = {
  category: Category | null;
  occasion: Occasion | null;
  budget: BudgetBandId | null;
};

export const EMPTY_FILTERS: Filters = { category: null, occasion: null, budget: null };

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
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Filters>(value);

  // Start each opening from the filters currently applied
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggle = <K extends keyof Filters>(key: K, v: Filters[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === v ? null : v }));

  const count = resultCount(draft);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close filters" />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(200)}
          className="max-h-[85%] rounded-t-[32px] bg-canvas"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-line" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
            <Text weight="bold" className="text-xl">
              Filters
            </Text>
            <IconButton icon={X} label="Close filters" onPress={onClose} size={38} />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Group title="Category">
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={draft.category === c}
                  onPress={() => toggle("category", c)}
                />
              ))}
            </Group>
            <Group title="Occasion">
              {OCCASIONS.map((o) => (
                <Chip
                  key={o}
                  label={OCCASION_META[o].short}
                  icon={OCCASION_META[o].icon}
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
            <Button
              label="Reset"
              variant="outline"
              className="flex-1"
              onPress={() => setDraft(EMPTY_FILTERS)}
            />
            <Button
              label={count === 1 ? "Show 1 gift" : `Show ${count} gifts`}
              variant="dark"
              className="flex-[2]"
              onPress={() => onApply(draft)}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

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
