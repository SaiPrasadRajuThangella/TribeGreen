import { useCallback, useMemo } from "react";

import { useProducts } from "@/hooks/useProducts";
import { defaultQuantity } from "@/lib/items";
import { useEnquiryList } from "@/store";

// Shared add/remove handler so product cards get one stable callback.
// Gifts with sizes or colours open the picker instead of being added straight away.
export function useListToggle() {
  const items = useEnquiryList((s) => s.items);
  const put = useEnquiryList((s) => s.put);
  const remove = useEnquiryList((s) => s.remove);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const { byId } = useProducts();

  const inList = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const toggle = useCallback(
    (id: string) => {
      const product = byId.get(id);
      if (!product) return;
      if (useEnquiryList.getState().items.some((i) => i.productId === id)) remove(id);
      else if (product.option) setEditing(id);
      else put(id, defaultQuantity(product));
    },
    [put, remove, setEditing, byId],
  );

  return { inList, toggle };
}
