import { useCallback, useEffect } from "react";

import { type Remote, useApiCache } from "@/store";

const inFlight: Partial<Record<Remote, Promise<unknown>>> = {};
const refreshed = new Set<Remote>(); // fetched since the app started

// One request at a time per resource, shared by every screen that asks
export function refreshRemote<T>(key: Remote, fetcher: () => Promise<T>) {
  inFlight[key] ??= fetcher()
    .then((data) => {
      refreshed.add(key);
      useApiCache.setState((s) => ({ [key]: data, errors: { ...s.errors, [key]: undefined } }));
    })
    .catch((e: Error) => useApiCache.setState((s) => ({ errors: { ...s.errors, [key]: e.message } })))
    .finally(() => delete inFlight[key]);
  return inFlight[key];
}

// Saved copy first, then a fresh one once per launch. retry() asks again (pull to refresh, Try again)
export function useRemote<K extends Remote, T>(key: K, fetcher: () => Promise<T>) {
  const data = useApiCache((s) => s[key]);
  const error = useApiCache((s) => s.errors[key] ?? null);

  useEffect(() => {
    if (!refreshed.has(key)) refreshRemote(key, fetcher);
  }, [key, fetcher]);

  const retry = useCallback(() => refreshRemote(key, fetcher), [key, fetcher]);

  return { data, error, loading: !data && !error, retry };
}
