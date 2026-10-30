import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import { useProducts } from "@/hooks/useProducts";
import { impact } from "@/lib/haptics";
import { defaultQuantity } from "@/lib/items";
import { useEnquiryList } from "@/store";

// Shared add/remove + open-product handlers so product cards get stable callbacks.
// Gifts with sizes or colours open the picker instead of being added straight away.
export function useListToggle() {
  const items = useEnquiryList((s) => s.items);
  const put = useEnquiryList((s) => s.put);
  const askRemove = useEnquiryList((s) => s.askRemove);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const { byId } = useProducts();

  const inList = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const toggle = useCallback(
    (id: string) => {
      const product = byId.get(id);
      if (!product) return;
      impact();
      if (useEnquiryList.getState().items.some((i) => i.productId === id)) askRemove(id);
      else if (product.option) setEditing(id);
      else put(id, defaultQuantity(product));
    },
    [put, askRemove, setEditing, byId],
  );

  const openProduct = useCallback((id: string) => router.push(`/product/${id}`), []);

  return { inList, toggle, openProduct };
}
