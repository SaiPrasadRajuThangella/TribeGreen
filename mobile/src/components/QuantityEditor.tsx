import { Minus, Plus } from "lucide-react-native";
import { memo, useState } from "react";
import { TextInput, View } from "react-native";

import { COLOUR_SWATCH } from "@/data/catalog";
import { type Quantity, setVariant, sumUnits, UNIT_STEP, unitsOf } from "@/lib/items";
import type { Product } from "@/types";

import { PressableScale, Text } from "./ui";

const SURFACES = {
  soft: { box: "bg-soft", button: "bg-card" },
  card: { box: "bg-card", button: "bg-soft" },
} as const;

// − [ 25 ] +   Typing is free; the minimum is applied when the field loses focus
export const NumberStepper = memo(function NumberStepper({
  value,
  onChange,
  min = 0,
  step = UNIT_STEP,
  label,
  size = "md",
  surface = "soft",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  label: string;
  size?: "sm" | "md";
  surface?: keyof typeof SURFACES;
}) {
  const [typing, setTyping] = useState<string | null>(null);
  const tone = SURFACES[surface];
  const button = `${size === "sm" ? "h-7 w-7" : "h-9 w-9"} items-center justify-center rounded-full ${tone.button}`;
  const icon = size === "sm" ? 13 : 15;

  return (
    <View className={`flex-row items-center justify-between rounded-full p-1 ${tone.box}`}>
      <PressableScale
        haptic
        hitSlop={6}
        accessibilityLabel={`Fewer ${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        className={`${button} ${value <= min ? "opacity-40" : ""}`}
      >
        <Minus size={icon} color="#121212" strokeWidth={2.5} />
      </PressableScale>
      <TextInput
        accessibilityLabel={label}
        keyboardType="number-pad"
        selectTextOnFocus
        value={typing ?? String(value)}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, "").slice(0, 6);
          setTyping(digits);
          onChange(Number(digits) || 0);
        }}
        onBlur={() => {
          setTyping(null);
          if (value < min) onChange(min);
        }}
        style={{ paddingVertical: 0 }}
        className={`text-center font-sans-bold text-ink ${size === "sm" ? "w-10 text-[14px]" : "w-14 text-[16px]"}`}
      />
      <PressableScale
        haptic
        hitSlop={6}
        accessibilityLabel={`More ${label}`}
        onPress={() => onChange(value + step)}
        className={button}
      >
        <Plus size={icon} color="#121212" strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
});

// One stepper for plain gifts; a grid of sizes / colours for gifts that come in variants
export const QuantityEditor = memo(function QuantityEditor({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: Quantity;
  onChange: (value: Quantity) => void;
}) {
  const option = product.option;

  if (!option) {
    return (
      <NumberStepper
        label="units"
        value={value.units}
        min={product.minOrder}
        onChange={(units) => onChange({ units })}
      />
    );
  }

  const change = (label: string, units: number) => {
    const variants = setVariant(product, value.variants, label, units);
    onChange({ units: sumUnits(variants), variants });
  };

  return (
    <View className="flex-row flex-wrap justify-between gap-y-2">
      {option.values.map((label) => {
        const units = unitsOf(value.variants, label);
        return (
          <View
            key={label}
            style={{ width: "48.5%" }}
            className={`rounded-2xl p-2.5 ${units ? "border border-lime-deep/50 bg-lime-soft" : "bg-soft/70"}`}
          >
            <View className="mb-2 flex-row items-center gap-1.5 px-1">
              {option.name === "Colour" ? (
                <View
                  className="h-3.5 w-3.5 rounded-full border border-ink/15"
                  style={{ backgroundColor: COLOUR_SWATCH[label] ?? "#ccc" }}
                />
              ) : null}
              <Text weight="semibold" className="text-[13px]">
                {label}
              </Text>
            </View>
            <NumberStepper
              label={`${label} units`}
              size="sm"
              surface="card"
              value={units}
              onChange={(n) => change(label, n)}
            />
          </View>
        );
      })}
    </View>
  );
});
