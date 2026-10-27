import { useEffect, useMemo, useState } from "react";

import { getProducts } from "@/lib/api";
import type { Product } from "@/types";

// Module-level cache so every page shares one fetch
let cache: Product[] | null = null;
let pending: Promise<Product[]> | null = null;

function load() {
  pending ??= getProducts()
    .then((data) => (cache = data))
    .finally(() => (pending = null));
  return pending;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[] | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load()
      .then((data) => alive && setProducts(data))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);

  return { products: products ?? [], byId, loading: !products && !error, error };
}
