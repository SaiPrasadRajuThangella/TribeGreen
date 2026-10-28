import { fitsBudget, getBudgetBand } from "@/data/catalog";
import type { BudgetBandId, Category, Occasion, Product } from "@/types";

export type Filters = {
  categories: Category[]; // empty means all categories
  occasion: Occasion | null;
  budget: BudgetBandId | null;
};

export const EMPTY_FILTERS: Filters = { categories: [], occasion: null, budget: null };

export function filterProducts(products: Product[], filters: Filters, query = "") {
  const q = query.trim().toLowerCase();
  const band = filters.budget ? getBudgetBand(filters.budget) : undefined;

  return products.filter(
    (p) =>
      (!filters.categories.length || filters.categories.includes(p.category)) &&
      (!filters.occasion || p.occasions.includes(filters.occasion)) &&
      (!band || fitsBudget(p, band)) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)),
  );
}

export const activeFilterCount = (f: Filters) =>
  f.categories.length + [f.occasion, f.budget].filter(Boolean).length;

// "Drinkware", "Drinkware & Apparel", "Drinkware, Apparel & Wellness"
export function joinCategories(categories: Category[]) {
  if (categories.length < 2) return categories[0] ?? "";
  return `${categories.slice(0, -1).join(", ")} & ${categories.at(-1)}`;
}
