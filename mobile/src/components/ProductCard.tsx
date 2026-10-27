import { Check, Plus } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { formatPriceRange } from "@/data/catalog";
import type { Product } from "@/types";

import { ProductImage } from "./ProductImage";
import { PressableScale, Text } from "./ui";

type Props = {
  product: Product;
  inList: boolean;
  onPress: (id: string) => void;
  onToggleList: (id: string) => void;
  width?: number;
};

export const ProductCard = memo(function ProductCard({
  product,
  inList,
  onPress,
  onToggleList,
  width,
}: Props) {
  // The add button sits beside (not inside) the card pressable so touches never nest
  return (
    <View style={width ? { width } : undefined} className={width ? "" : "flex-1"}>
      <PressableScale
        scaleTo={0.97}
        onPress={() => onPress(product.id)}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatPriceRange(product)} per unit`}
        className="rounded-[26px] bg-card p-2"
      >
        <View className="overflow-hidden rounded-[20px]">
          <ProductImage source={product.images[0]} className="aspect-square w-full" />
          {product.tag ? (
            <View className="absolute left-2 top-2 rounded-full bg-card/90 px-2.5 py-1">
              <Text weight="semibold" className="text-[10px] uppercase tracking-wider">
                {product.tag}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-1.5 pb-1 pt-2.5">
          <Text tone="muted" className="mb-0.5 text-[11px]">
            {product.category}
          </Text>
          <Text weight="semibold" numberOfLines={1} className="text-[14px]">
            {product.name}
          </Text>
          <View className="mt-2">
            <Text weight="bold" className="text-[14px]">
              ₹{product.priceMin.toLocaleString("en-IN")}
            </Text>
            <Text tone="faint" className="text-[10px]">
              onwards / unit
            </Text>
          </View>
        </View>
      </PressableScale>
      <PressableScale
        haptic
        hitSlop={8}
        onPress={() => onToggleList(product.id)}
        accessibilityRole="button"
        accessibilityLabel={
          inList ? `Remove ${product.name} from enquiry list` : `Add ${product.name} to enquiry list`
        }
        className={`absolute bottom-3.5 right-3.5 h-9 w-9 items-center justify-center rounded-full ${inList ? "bg-lime" : "bg-ink"}`}
      >
        {inList ? (
          <Check size={16} color="#121212" strokeWidth={2.6} />
        ) : (
          <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
        )}
      </PressableScale>
    </View>
  );
});
