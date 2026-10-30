import { getLists } from "@/lib/api";
import type { Lists } from "@/types";

import { useRemote } from "./useRemote";

const EMPTY: Lists = { categories: [], occasions: [], customisations: [], statuses: [], orderStages: [] };

// Category, occasion, customisation, status and order-stage names from the API.
// Empty lists until the first copy arrives; `ready` says when to stop showing placeholders.
export function useLists() {
  const { data, error, retry } = useRemote("lists", getLists);
  return { ...((data as Lists | null) ?? EMPTY), ready: !!data, error, retry };
}
