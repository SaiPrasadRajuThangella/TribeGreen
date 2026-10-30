import { useMemo } from "react";

import { getProducts } from "@/lib/api";
import type { Product } from "@/types";

import { useRemote } from "./useRemote";

const NONE: Product[] = [];

// The catalogue: the copy saved on the device straight away, refreshed once per launch
export function useProducts() {
  const { data, error, loading, retry } = useRemote("products", getProducts);
  const products = (data as Product[] | null) ?? NONE;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  return { products, byId, loading, error, retry };
}
