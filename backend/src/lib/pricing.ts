import { type BudgetBandId, CUSTOMISATIONS, type Customisation } from "../domain.js";

/*
 * Every gift has a base price per unit (plain) and a set extra per unit for each customisation
 * it offers. More customisation costs more: the price is the base plus what was picked.
 */
export type Priced = {
  basePrice: number;
  customisationPrices?: Partial<Record<Customisation, number | null>> | null;
};

// What the gift offers, in the standard order
export const offeredCustomisations = (p: Priced) =>
  CUSTOMISATIONS.filter((c) => typeof p.customisationPrices?.[c] === "number");

export const unitPrice = (p: Priced, picked: readonly Customisation[] = []) =>
  offeredCustomisations(p)
    .filter((c) => picked.includes(c))
    .reduce((sum, c) => sum + (p.customisationPrices![c] as number), p.basePrice);

// From plain to fully customised
export const priceRange = (p: Priced) => ({ min: p.basePrice, max: unitPrice(p, CUSTOMISATIONS) });

// The brief's "budget per unit", worked out from the gifts instead of asked for
export function budgetBandFor(perUnit: number): BudgetBandId {
  if (perUnit < 500) return "under-500";
  if (perUnit <= 1500) return "500-1500";
  if (perUnit <= 3000) return "1500-3000";
  return "above-3000";
}
