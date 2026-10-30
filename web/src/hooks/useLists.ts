import { useCallback, useEffect, useState } from "react";

import { getLists } from "@/lib/api";
import type { Lists } from "@/types";

const EMPTY: Lists = { categories: [], occasions: [], customisations: [], statuses: [], orderStages: [] };

// Module-level cache so every page shares one fetch
let cache: Lists | null = null;
let pending: Promise<Lists> | null = null;

function load() {
  pending ??= getLists()
    .then((data) => (cache = data))
    .finally(() => (pending = null));
  return pending;
}

// Category, occasion, customisation, status and order-stage names from the API.
// The lists are empty until they arrive, so callers show placeholders while `loading`.
export function useLists() {
  const [lists, setLists] = useState<Lists | null>(cache);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    let alive = true;
    load()
      .then((data) => alive && setLists(data))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (cache) return;
    return fetchAll();
  }, [fetchAll]);

  const retry = useCallback(() => {
    setError(null);
    fetchAll();
  }, [fetchAll]);

  return { lists: lists ?? EMPTY, loading: !lists && !error, error, retry };
}
