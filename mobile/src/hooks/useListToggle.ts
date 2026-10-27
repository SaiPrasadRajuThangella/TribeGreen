import { router } from "expo-router";
import { useCallback, useMemo } from "react";

import { useProducts } from "@/hooks/useProducts";
import { impact } from "@/lib/haptics";
import { useEnquiryList } from "@/store";

// Shared add/remove + open-product handlers so product cards get stable callbacks
export function useListToggle() {
  const items = useEnquiryList((s) => s.items);
  const add = useEnquiryList((s) => s.add);
  const remove = useEnquiryList((s) => s.remove);
  const { byId } = useProducts();

  const inList = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const toggle = useCallback(
    (id: string) => {
      impact();
      if (useEnquiryList.getState().items.some((i) => i.productId === id)) remove(id);
      else add(id, byId.get(id)?.minOrder ?? 25);
    },
    [add, remove, byId],
  );

  const openProduct = useCallback((id: string) => router.push(`/product/${id}`), []);

  return { inList, toggle, openProduct };
}
