import type { Filters } from "@/components/FilterSheet";
import { fitsBudget, getBudgetBand } from "@/data/catalog";
import type { Product } from "@/types";

export function filterProducts(products: Product[], filters: Filters, query = "") {
  const q = query.trim().toLowerCase();
  const band = filters.budget ? getBudgetBand(filters.budget) : undefined;

  return products.filter(
    (p) =>
      (!filters.category || p.category === filters.category) &&
      (!filters.occasion || p.occasions.includes(filters.occasion)) &&
      (!band || fitsBudget(p, band)) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)),
  );
}

export const activeFilterCount = (f: Filters) => [f.category, f.occasion, f.budget].filter(Boolean).length;
