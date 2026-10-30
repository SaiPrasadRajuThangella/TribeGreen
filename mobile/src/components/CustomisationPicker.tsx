import { Check, Plus } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { CUSTOMISATION_META, formatINR } from "@/data/catalog";
import { toggleIn } from "@/lib/items";
import { type Customisation, CUSTOMISATIONS, type Product } from "@/types";

import { PressableScale, Text } from "./ui";

type Props = {
  product: Product;
  value: Customisation[] | undefined;
  onChange: (value: Customisation[]) => void;
};

// "Do you want logo printing? Engraving? Names?" for one gift, with what each adds per unit.
// Options the product doesn't offer stay visible but can't be picked.
export const CustomisationPicker = memo(function CustomisationPicker({
  product,
  value = [],
  onChange,
}: Props) {
  return (
    <View className="gap-2">
      {CUSTOMISATIONS.map((c) => {
        const { icon: Icon, hint } = CUSTOMISATION_META[c];
        const offered = product.customisations.includes(c);
        const on = offered && value.includes(c);
        return (
          <PressableScale
            key={c}
            haptic
            scaleTo={0.98}
            disabled={!offered}
            onPress={() => onChange(toggleIn(value, c))}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: !offered }}
            className={`flex-row items-center gap-3 rounded-2xl p-3 ${
              on ? "border border-lime-deep/50 bg-lime-soft" : offered ? "bg-soft/70" : "bg-soft/40"
            }`}
          >
            <View
              className={`h-10 w-10 items-center justify-center rounded-full ${on ? "bg-lime" : "bg-card"}`}
            >
              <Icon size={17} color={offered ? "#2B2B2B" : "#A3A69D"} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text weight="semibold" tone={offered ? "ink" : "faint"} className="text-[14px]">
                {c}
                {offered ? (
                  <Text weight="semibold" tone="limeInk" className="text-[13px]">
                    {"  "}+{formatINR(product.customisationPrices[c] ?? 0)}
                  </Text>
                ) : null}
              </Text>
              <Text tone="muted" className="text-[12px]">
                {offered ? hint : "Not offered for this gift"}
              </Text>
            </View>
            {offered ? (
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${on ? "bg-ink" : "border border-line bg-card"}`}
              >
                {on ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Plus size={14} color="#A3A69D" strokeWidth={2.5} />
                )}
              </View>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
});

// Compact pills for the list and the quote form: only what the gift offers
export const CustomisationPills = memo(function CustomisationPills({
  product,
  value = [],
  onToggle,
}: Omit<Props, "onChange"> & { onToggle: (c: Customisation) => void }) {
  if (!product.customisations.length) return null;
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {product.customisations.map((c) => {
        const { icon: Icon, short } = CUSTOMISATION_META[c];
        const on = value.includes(c);
        return (
          <PressableScale
            key={c}
            haptic
            onPress={() => onToggle(c)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={c}
            className={`h-7 flex-row items-center gap-1 rounded-full px-2.5 ${on ? "bg-lime" : "border border-line bg-card"}`}
          >
            {on ? (
              <Check size={12} color="#121212" strokeWidth={3} />
            ) : (
              <Icon size={12} color="#73776E" strokeWidth={2} />
            )}
            <Text weight="semibold" tone={on ? "ink" : "muted"} className="text-[11px]">
              {short} +{formatINR(product.customisationPrices[c] ?? 0)}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
});
