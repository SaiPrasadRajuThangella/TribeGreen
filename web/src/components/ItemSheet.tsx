import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { formatINR, formatPriceRange } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useScrollLock } from "@/hooks/useScrollLock";
import { type Choice, cleanCustomisations, defaultQuantity, estimateFor, quantityProblem } from "@/lib/items";
import { useEnquiryList } from "@/store";
import type { Product } from "@/types";

import { CustomisationPicker } from "./CustomisationPicker";
import { QuantityEditor } from "./QuantityEditor";
import { Button } from "./ui";

// Pick sizes / colours for a gift, from a product card, the drawer or the enquiry form
export function ItemSheet() {
  const editing = useEnquiryList((s) => s.editing);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const { byId } = useProducts();
  const product = editing ? byId.get(editing) : undefined;

  return (
    <AnimatePresence>
      {product ? <Sheet key={product.id} product={product} onClose={() => setEditing(null)} /> : null}
    </AnimatePresence>
  );
}

function Sheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const existing = useEnquiryList((s) => s.items.find((i) => i.productId === product.id));
  const put = useEnquiryList((s) => s.put);
  const [qty, setQty] = useState<Choice>(() =>
    existing
      ? { units: existing.units, variants: existing.variants, customisations: existing.customisations }
      : defaultQuantity(product),
  );
  const problem = quantityProblem(product, qty);
  const estimate = estimateFor(product, qty.units);
  const optionName = product.option?.name.toLowerCase() ?? "quantity";
  const [a, b] = product.option?.name === "Size" ? ["M", "L"] : (product.option?.values ?? []);

  useScrollLock(true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    if (problem) return;
    put(product.id, { ...qty, customisations: cleanCustomisations(product, qty.customisations) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose ${optionName}s for ${product.name}`}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[32px] bg-canvas p-5 sm:max-w-lg sm:rounded-[32px] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <img src={product.images[0]} alt="" className="size-16 rounded-2xl bg-soft object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{product.name}</p>
            <p className="text-sm text-muted">{formatPriceRange(product)} / unit</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-card hover:bg-soft"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 mb-3">
          <p className="font-semibold">Choose {optionName}s</p>
          <p className="text-sm text-muted">
            Mix freely, for example 10 {a} and 10 {b}. {product.minOrder} units minimum in total.
          </p>
        </div>
        <QuantityEditor product={product} value={qty} onChange={(q) => setQty((c) => ({ ...c, ...q }))} />

        {product.customisations.length ? (
          <div className="mt-6">
            <p className="mb-3 font-semibold">
              Customise this gift <span className="text-sm font-normal text-muted">(optional)</span>
            </p>
            <CustomisationPicker
              product={product}
              value={qty.customisations}
              onChange={(customisations) => setQty((c) => ({ ...c, customisations }))}
            />
          </div>
        ) : null}

        <div className="mt-5 flex items-end justify-between rounded-2xl bg-card px-4 py-3">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="text-lg font-extrabold tabular-nums">{qty.units.toLocaleString("en-IN")} units</p>
          </div>
          <p className="text-right text-sm text-muted">
            {qty.units ? `${formatINR(estimate.min)} – ${formatINR(estimate.max)}` : "Estimate shows here"}
          </p>
        </div>
        {problem && qty.units > 0 ? <p className="mt-2 text-sm text-danger">{problem}</p> : null}

        <Button variant="dark" icon={Check} className="mt-5 w-full" disabled={!!problem} onClick={save}>
          {existing ? "Save changes" : "Add to enquiry list"}
        </Button>
      </motion.div>
    </div>
  );
}
