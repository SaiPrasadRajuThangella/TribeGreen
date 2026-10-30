import { Check, Plus } from "lucide-react";

import { customisationMeta, formatINR } from "@/data/catalog";
import { useLists } from "@/hooks/useLists";
import { toggleIn } from "@/lib/items";
import type { Customisation, Product } from "@/types";

type Props = {
  product: Product;
  value: Customisation[] | undefined;
  onChange: (value: Customisation[]) => void;
};

// "Do you want logo printing? Engraving? Names?" for one gift.
// Options the product doesn't offer stay visible but can't be picked.
export function CustomisationPicker({ product, value = [], onChange }: Props) {
  const { lists, loading } = useLists();
  // Until the names arrive, show what this gift offers so the picker never sits empty
  const names = loading ? product.customisations : lists.customisations;
  return (
    <ul className="space-y-2">
      {names.map((c) => {
        const { icon: Icon, hint } = customisationMeta(c);
        const offered = product.customisations.includes(c);
        const on = offered && value.includes(c);
        return (
          <li key={c}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!offered}
              onClick={() => onChange(toggleIn(value, c))}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition duration-200 ${
                on
                  ? "bg-lime-soft ring-1 ring-lime-deep/50"
                  : offered
                    ? "bg-soft/70 hover:bg-soft"
                    : "cursor-not-allowed bg-soft/40"
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  on ? "bg-lime text-ink" : offered ? "bg-card text-ink-soft" : "bg-card text-faint"
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${offered ? "" : "text-faint"}`}>
                  {c}
                  {offered ? (
                    <span className="ml-1.5 font-semibold text-lime-ink">
                      +{formatINR(product.customisationPrices[c] ?? 0)}
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-muted">
                  {offered ? hint : "Not offered for this gift"}
                </span>
              </span>
              {offered ? (
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-full transition ${
                    on ? "bg-ink text-white" : "border border-line bg-card text-faint"
                  }`}
                >
                  {on ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Compact pills for the list drawer and the quote form: only what the gift offers
export function CustomisationPills({
  product,
  value = [],
  onToggle,
}: Omit<Props, "onChange"> & {
  onToggle: (c: Customisation) => void;
}) {
  if (!product.customisations.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Customisation for ${product.name}`}>
      {product.customisations.map((c) => {
        const { icon: Icon, short } = customisationMeta(c);
        const on = value.includes(c);
        return (
          <button
            key={c}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={c}
            title={c}
            onClick={() => onToggle(c)}
            className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition active:scale-95 ${
              on
                ? "bg-lime text-ink"
                : "border border-line bg-card text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {on ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
            {short}
            <span className={on ? "text-ink/60" : "text-faint"}>
              +{formatINR(product.customisationPrices[c] ?? 0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
