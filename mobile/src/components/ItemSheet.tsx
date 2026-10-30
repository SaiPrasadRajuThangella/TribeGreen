import { Check, X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { formatINR } from "@/data/catalog";
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
import { useEnquiryList } from "@/store";
import type { Product } from "@/types";

import { BottomSheet } from "./BottomSheet";
import { CustomisationPicker } from "./CustomisationPicker";
import { ProductImage } from "./ProductImage";
import { QuantityEditor } from "./QuantityEditor";
import { Button, IconButton, Text } from "./ui";

// Pick sizes / colours and customisation for a gift, from a product card or the list
export function ItemSheet() {
  const editing = useEnquiryList((s) => s.editing);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const { byId } = useProducts();
  const product = editing ? byId.get(editing) : undefined;
  const close = () => setEditing(null);

  return (
    <BottomSheet visible={!!product} onClose={close} maxHeight="90%">
      {product ? <Sheet key={product.id} product={product} onClose={close} /> : null}
    </BottomSheet>
  );
}

function Sheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const existing = useEnquiryList((s) => s.items.find((i) => i.productId === product.id));
  const put = useEnquiryList((s) => s.put);
  const [choice, setChoice] = useState<Choice>(() =>
    existing
      ? { units: existing.units, variants: existing.variants, customisations: existing.customisations }
      : defaultQuantity(product),
  );
  const problem = quantityProblem(product, choice);
  const optionName = product.option?.name.toLowerCase() ?? "quantity";
  const [a, b] = product.option?.name === "Size" ? ["M", "L"] : (product.option?.values ?? []);

  const save = () => {
    if (problem) return;
    success();
    put(product.id, { ...choice, customisations: cleanCustomisations(product, choice.customisations) });
    onClose();
  };

  return (
    <>
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-3">
        <ProductImage source={product.images[0]} className="h-14 w-14 rounded-2xl" />
        <View className="flex-1">
          <Text weight="bold" numberOfLines={1} className="text-[16px]">
            {product.name}
          </Text>
          <Text tone="muted" className="text-[12px]">
            {formatINR(priceFor(product, choice))} / unit with your choices
          </Text>
        </View>
        <IconButton icon={X} label="Close" onPress={onClose} size={38} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        {product.option ? (
          <>
            <Text weight="bold" className="mt-3 text-[15px]">
              Choose {optionName}s
            </Text>
            <Text tone="muted" className="mb-3 text-[13px]">
              Mix freely, for example 10 {a} and 10 {b}. {product.minOrder} units minimum in total.
            </Text>
          </>
        ) : (
          <Text weight="bold" className="mb-3 mt-3 text-[15px]">
            Quantity
          </Text>
        )}
        <QuantityEditor
          product={product}
          value={choice}
          onChange={(q) => setChoice((c) => ({ ...c, ...q }))}
        />

        {product.customisations.length ? (
          <>
            <Text weight="bold" className="mb-3 mt-5 text-[15px]">
              Customise this gift <Text tone="muted">(optional)</Text>
            </Text>
            <CustomisationPicker
              product={product}
              value={choice.customisations}
              onChange={(customisations) => setChoice((c) => ({ ...c, customisations }))}
            />
          </>
        ) : null}
      </ScrollView>

      <View className="px-5 pt-3">
        <View className="mb-3 flex-row items-end justify-between rounded-2xl bg-card px-4 py-3">
          <View>
            <Text tone="muted" className="text-[11px]">
              Total
            </Text>
            <Text weight="extrabold" className="text-[17px]">
              {choice.units.toLocaleString("en-IN")} units
            </Text>
          </View>
          <Text tone="muted" className="text-[13px]">
            {choice.units ? `Estimated ${formatINR(lineTotal(product, choice))}` : "Estimate shows here"}
          </Text>
        </View>
        {problem && choice.units > 0 ? (
          <Text tone="danger" className="mb-2 text-[13px]">
            {problem}
          </Text>
        ) : null}
        <Button
          label={existing ? "Save changes" : "Add to enquiry list"}
          icon={Check}
          variant="dark"
          disabled={!!problem}
          onPress={save}
        />
      </View>
    </>
  );
}
