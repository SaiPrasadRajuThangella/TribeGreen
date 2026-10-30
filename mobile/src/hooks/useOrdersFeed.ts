import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { getMyEnquiries } from "@/lib/api";
import { useMyOrders } from "@/store";

const REFRESH_MS = 20000;

// The signed-in customer's enquiries and orders. Reloads whenever the screen comes into view
// and every 20 seconds while it stays open, so the team's updates show up on their own.
export function useOrdersFeed(enabled: boolean) {
  const enquiries = useMyOrders((s) => s.enquiries);
  const error = useMyOrders((s) => s.error);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { setAll, setError } = useMyOrders.getState();
    try {
      setAll(await getMyEnquiries());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      load();
      const timer = setInterval(load, REFRESH_MS);
      return () => clearInterval(timer);
    }, [enabled, load]),
  );

  // Pull to refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return {
    enquiries: enquiries ?? [],
    loading: enabled && enquiries === null && !error,
    error,
    refreshing,
    refresh,
  };
}
