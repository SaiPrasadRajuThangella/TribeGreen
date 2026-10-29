import { useEffect } from "react";

import { getMyEnquiries } from "@/lib/api";
import { useMyOrders } from "@/store";

const REFRESH_MS = 20000;

// The signed-in customer's enquiries and orders, refreshed while the page is open
// so the team's updates show up without a reload
export function useOrdersFeed() {
  const enquiries = useMyOrders((s) => s.enquiries);
  const error = useMyOrders((s) => s.error);

  useEffect(() => {
    let alive = true;
    const { setAll, setError } = useMyOrders.getState();
    const load = () =>
      getMyEnquiries()
        .then((list) => alive && setAll(list))
        .catch((e: Error) => alive && setError(e.message));

    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    const timer = setInterval(onVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return { enquiries: enquiries ?? [], loading: enquiries === null && !error, error };
}
