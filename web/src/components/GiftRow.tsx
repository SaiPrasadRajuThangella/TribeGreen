import { Pencil, Trash2 } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";

import { formatPriceRange } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { quantityProblem } from "@/lib/items";
import { type ListItem, useEnquiryList } from "@/store";
import type { Product } from "@/types";

import { ConfirmDialog } from "./ConfirmDialog";
import { CustomisationPills } from "./CustomisationPicker";
import { NumberStepper } from "./QuantityEditor";

// A gift in the enquiry list: units for plain gifts, a size / colour split for the rest
export const GiftRow = memo(function GiftRow({
  item,
  product,
  surface = "card",
  showProblem = true,
  onNavigate,
}: {
  item: ListItem;
  product: Product;
  surface?: "card" | "canvas";
  showProblem?: boolean;
  onNavigate?: () => void;
}) {
  const askRemove = useEnquiryList((s) => s.askRemove);
  const setUnits = useEnquiryList((s) => s.setUnits);
  const toggleCustomisation = useEnquiryList((s) => s.toggleCustomisation);
  const setEditing = useEnquiryList((s) => s.setEditing);
  const problem = showProblem ? quantityProblem(product, item) : null;
  const optionName = product.option?.name.toLowerCase();

  return (
    <div
      className={`flex gap-3 rounded-3xl p-2.5 ${surface === "card" ? "bg-card" : "bg-canvas"} ${
        problem ? "ring-2 ring-danger/50" : ""
      }`}
    >
      <Link to={`/product/${product.id}`} onClick={onNavigate} className="shrink-0">
        <img src={product.images[0]} alt="" className="size-20 rounded-2xl bg-soft object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-xs text-muted">{formatPriceRange(product)} / unit</p>
          </div>
          <button
            type="button"
            onClick={() => askRemove(product.id)}
            aria-label={`Remove ${product.name}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {product.option ? (
          <button
            type="button"
            onClick={() => setEditing(product.id)}
            aria-label={`Edit ${optionName}s for ${product.name}`}
            className="group flex flex-wrap items-center gap-1.5 text-left"
          >
            {item.variants?.length ? (
              <>
                {item.variants.map((v) => (
                  <span
                    key={v.label}
                    className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                  >
                    {v.label} · {v.units}
                  </span>
                ))}
                <span className="text-xs font-semibold text-muted tabular-nums">= {item.units}</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-danger">Choose {optionName}s</span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs font-semibold text-lime-ink group-hover:bg-lime-soft">
              <Pencil size={12} /> Edit
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <NumberStepper
              label={`units of ${product.name}`}
              size="sm"
              value={item.units}
              min={product.minOrder}
              onChange={(units) => setUnits(product.id, units)}
            />
            <span className="text-xs text-faint">units</span>
          </div>
        )}
        <CustomisationPills
          product={product}
          value={item.customisations}
          onToggle={(c) => toggleCustomisation(product.id, c)}
        />
        {problem ? <p className="text-xs text-danger">{problem}</p> : null}
      </div>
    </div>
  );
});

// One "Are you sure?" for the whole site, opened from any gift row
export function RemoveGiftDialog() {
  const removing = useEnquiryList((s) => s.removing);
  const askRemove = useEnquiryList((s) => s.askRemove);
  const remove = useEnquiryList((s) => s.remove);
  const { byId } = useProducts();
  const name = removing ? (byId.get(removing)?.name ?? "this gift") : "";

  return (
    <ConfirmDialog
      open={!!removing}
      title={`Remove ${name}?`}
      body="Its quantities and customisation will be cleared from your enquiry list."
      confirmLabel="Remove"
      cancelLabel="Keep it"
      onConfirm={() => removing && remove(removing)}
      onCancel={() => askRemove(null)}
    />
  );
}
