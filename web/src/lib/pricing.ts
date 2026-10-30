import type { Customisation, Product, ProductData } from "../types.ts";

/*
 * Every gift has a base price per unit (plain) and a set extra per unit for each customisation
 * it offers. More customisation costs more: the price is the base plus what was picked.
 * The backend works prices out the same way (backend/src/lib/pricing.ts).
 */

// What a gift offers is whatever it has a price for (no API needed, so build time works too)
export const offeredCustomisations = (p: Pick<ProductData, "customisationPrices">) =>
  Object.keys(p.customisationPrices).filter((c) => typeof p.customisationPrices[c] === "number");

export const unitPrice = (
  p: Pick<ProductData, "basePrice" | "customisationPrices">,
  picked: Customisation[] = [],
) =>
  offeredCustomisations(p)
    .filter((c) => picked.includes(c))
    .reduce((sum, c) => sum + (p.customisationPrices[c] ?? 0), p.basePrice);

// The fields the API adds, for data written in files
export const withPricing = (p: ProductData): Product => ({
  ...p,
  customisations: offeredCustomisations(p),
  priceMin: p.basePrice,
  priceMax: unitPrice(p, offeredCustomisations(p)),
});
