import { MIN_ORDER } from "@/data/products";
import type { EnquiryItem, Product, VariantQty } from "@/types";

// Quantity of one gift: a plain number, or units per size / colour
export type Quantity = { units: number; variants?: VariantQty[] };

export const UNIT_STEP = 5;

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

export const defaultQuantity = (product: Product): Quantity =>
  product.option ? { units: 0, variants: [] } : { units: product.minOrder || MIN_ORDER };

// Why a gift can't be sent yet, or null when it is fine
export function quantityProblem(product: Product | undefined, qty: Quantity) {
  const min = product?.minOrder || MIN_ORDER;
  if (product?.option && !qty.variants?.length)
    return `Pick ${product.option.name.toLowerCase()}s and quantities`;
  if (qty.units < min) return `Minimum ${min} units in total`;
  return null;
}

export const estimateFor = (product: Product, units: number) => ({
  min: units * product.priceMin,
  max: units * product.priceMax,
});

export const toEnquiryItem = (product: Product, qty: Quantity): EnquiryItem => ({
  id: product.id,
  name: product.name,
  units: qty.units,
  ...(product.option ? { variants: qty.variants ?? [] } : {}),
});
