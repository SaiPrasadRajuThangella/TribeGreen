import { useCallback, useState } from "react";

import { getLists, getProducts } from "@/lib/api";

import { refreshRemote } from "./useRemote";

// Pull to refresh on the browsing screens: a fresh catalogue and fresh names
export function usePullToRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshRemote("products", getProducts), refreshRemote("lists", getLists)]);
    setRefreshing(false);
  }, []);
  return { refreshing, onRefresh };
}
