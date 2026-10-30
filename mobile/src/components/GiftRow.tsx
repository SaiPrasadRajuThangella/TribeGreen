import { router } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { lineTotal, priceFor, quantityProblem } from "@/lib/items";
import { type ListItem, useEnquiryList } from "@/store";
import type { Product } from "@/types";

import { ConfirmDialog } from "./ConfirmDialog";
import { CustomisationPills } from "./CustomisationPicker";
import { ProductImage } from "./ProductImage";
import { NumberStepper } from "./QuantityEditor";
import { PressableScale, Text } from "./ui";

// A gift in the enquiry list: units or a size / colour split, its customisation and price
export const GiftRow = memo(function GiftRow({
  item,
  product,
  surface = "card",
}: {
  item: ListItem;
  product: Product;
  surface?: "card" | "canvas";
}) {
  const askRemove = useEnquiryList((s) => s.askRemove);
  const setUnits = useEnquiryList((s) => s.setUnits);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const toggleCustomisation = useEnquiryList((s) => s.toggleCustomisation);
  const problem = quantityProblem(product, item);
  const optionName = product.option?.name.toLowerCase();

  return (
    <View
      className={`flex-row gap-3 rounded-[24px] p-2.5 ${surface === "card" ? "bg-card" : "bg-canvas"} ${
        problem ? "border-2 border-danger/50" : ""
      }`}
    >
      <PressableScale scaleTo={0.97} onPress={() => router.push(`/product/${product.id}`)}>
        <ProductImage source={product.images[0]} className="h-[76px] w-[76px] rounded-[18px]" />
      </PressableScale>
      <View className="flex-1 gap-2 py-0.5">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text weight="semibold" numberOfLines={1} className="text-[14px]">
              {product.name}
            </Text>
            <Text tone="muted" className="mt-0.5 text-[12px]">
              {formatINR(priceFor(product, item))} / unit
              {item.units ? (
                <Text weight="semibold" className="text-[12px]">
                  {" "}
                  · {formatINR(lineTotal(product, item))}
                </Text>
              ) : null}
            </Text>
          </View>
          <PressableScale
            haptic
            hitSlop={8}
            onPress={() => askRemove(product.id)}
            accessibilityLabel={`Remove ${product.name}`}
            className="h-8 w-8 items-center justify-center rounded-full"
          >
            <Trash2 size={16} color="#73776E" strokeWidth={2} />
          </PressableScale>
        </View>

        {product.option ? (
          <PressableScale
            haptic
            scaleTo={0.98}
            onPress={() => setEditing(product.id)}
            accessibilityLabel={`Edit ${optionName}s for ${product.name}`}
            className="flex-row flex-wrap items-center gap-1.5"
          >
            {item.variants?.length ? (
              <>
                {item.variants.map((v) => (
                  <View key={v.label} className="rounded-full bg-soft px-2.5 py-1">
                    <Text weight="semibold" className="text-[11px]">
                      {v.label} · {v.units}
                    </Text>
                  </View>
                ))}
                <Text weight="semibold" tone="muted" className="text-[12px]">
                  = {item.units}
                </Text>
              </>
            ) : (
              <Text weight="semibold" tone="danger" className="text-[12px]">
                Choose {optionName}s
              </Text>
            )}
            <View className="flex-row items-center gap-1 rounded-full bg-lime-soft px-2 py-1">
              <Pencil size={11} color="#3A5512" strokeWidth={2.4} />
              <Text weight="semibold" tone="limeInk" className="text-[11px]">
                Edit
              </Text>
            </View>
          </PressableScale>
        ) : (
          <View className="flex-row items-center gap-2 self-start">
            <NumberStepper
              label={`units of ${product.name}`}
              size="sm"
              value={item.units}
              min={product.minOrder}
              onChange={(units) => setUnits(product.id, units)}
            />
            <Text tone="faint" className="text-[11px]">
              units
            </Text>
          </View>
        )}

        <CustomisationPills
          product={product}
          value={item.customisations}
          onToggle={(c) => toggleCustomisation(product.id, c)}
        />
        {problem ? (
          <Text tone="danger" className="text-[12px]">
            {problem}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

// One "Are you sure?" for the whole app, opened from any gift row
export function RemoveGiftDialog() {
  const removing = useEnquiryList((s) => s.removing);
  const askRemove = useEnquiryList((s) => s.askRemove);
  const remove = useEnquiryList((s) => s.remove);
  const { byId } = useProducts();
  const name = removing ? (byId.get(removing)?.name ?? "this gift") : "";

  return (
    <ConfirmDialog
      visible={!!removing}
      title={`Remove ${name}?`}
      body="Its quantities and customisation will be cleared from your enquiry list."
      confirmLabel="Remove"
      cancelLabel="Keep it"
      onConfirm={() => removing && remove(removing)}
      onCancel={() => askRemove(null)}
    />
  );
}
