import { CUSTOMISATIONS, type Customisation, type EnquiryItem, type Product, type VariantQty } from "@/types";

// Every gift can be ordered from 10 units
export const MIN_ORDER = 10;
export const UNIT_STEP = 5;

// Quantity of one gift: a plain number, or units per size / colour
export type Quantity = { units: number; variants?: VariantQty[] };

// Everything chosen for one gift: quantity plus its customisation
export type Choice = Quantity & { customisations?: Customisation[] };

export const toggleIn = <T>(list: T[] = [], value: T) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

// Only what this product offers, in the standard order
export const cleanCustomisations = (product: Product, picked: Customisation[] = []) =>
  product.customisations.filter((c) => picked.includes(c));

/*
 * Price per unit: the base price plus what each picked customisation adds.
 * The backend works it out the same way when the enquiry arrives.
 */
export const unitPrice = (product: Product, picked: Customisation[] = []) =>
  cleanCustomisations(product, picked).reduce(
    (sum, c) => sum + (product.customisationPrices[c] ?? 0),
    product.basePrice,
  );

export const priceFor = (product: Product, choice: Choice) => unitPrice(product, choice.customisations);
export const lineTotal = (product: Product, choice: Choice) => choice.units * priceFor(product, choice);

// What a sent enquiry comes to at catalogue prices
export const enquiryEstimate = (items: EnquiryItem[]) =>
  items.reduce((sum, i) => sum + i.units * (i.listPrice ?? 0), 0);

export const sumUnits = (variants: VariantQty[]) => variants.reduce((sum, v) => sum + v.units, 0);

// Units per variant in the product's own order (XS → XXL), zero rows dropped
export function setVariant(product: Product, variants: VariantQty[] = [], label: string, units: number) {
  const next = new Map(variants.map((v) => [v.label, v.units]));
  next.set(label, Math.max(0, Math.round(units) || 0));
  return (product.option?.values ?? [])
    .map((value) => ({ label: value, units: next.get(value) ?? 0 }))
    .filter((v) => v.units > 0);
}

export const unitsOf = (variants: VariantQty[] | undefined, label: string) =>
  variants?.find((v) => v.label === label)?.units ?? 0;

// "M × 10 · L × 10"
export const describeVariants = (variants: VariantQty[] = []) =>
  variants.map((v) => `${v.label} × ${v.units}`).join(" · ");

export const defaultQuantity = (product: Product): Choice =>
  product.option ? { units: 0, variants: [] } : { units: product.minOrder || MIN_ORDER };

// Why a gift can't be sent yet, or null when it is fine
export function quantityProblem(product: Product | undefined, qty: Quantity) {
  const min = product?.minOrder || MIN_ORDER;
  if (product?.option && !qty.variants?.length) {
    return `Pick ${product.option.name.toLowerCase()}s and quantities`;
  }
  if (qty.units < min) return `Minimum ${min} units in total`;
  return null;
}

export const toEnquiryItem = (product: Product, choice: Choice): EnquiryItem => ({
  id: product.id,
  name: product.name,
  units: choice.units,
  ...(product.option ? { variants: choice.variants ?? [] } : {}),
  customisations: cleanCustomisations(product, choice.customisations),
});

// The enquiry-level list the brief asks for: every customisation across the gifts
export const allCustomisations = (items: EnquiryItem[]) =>
  CUSTOMISATIONS.filter((c) => items.some((i) => i.customisations?.includes(c)));
