import { fitsBudget, getBudgetBand } from "@/data/catalog";
import type { BudgetBandId, Category, Occasion, Product } from "@/types";

export type Filters = {
  category: Category | null;
  occasion: Occasion | null;
  budget: BudgetBandId | null;
};

export const EMPTY_FILTERS: Filters = { category: null, occasion: null, budget: null };

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
