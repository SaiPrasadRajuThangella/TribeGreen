import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { COLOUR_SWATCH } from "@/data/catalog";
import { type Quantity, setVariant, sumUnits, UNIT_STEP, unitsOf } from "@/lib/items";
import type { Product } from "@/types";

const SURFACES = {
  soft: { box: "bg-soft", button: "bg-card" },
  card: { box: "bg-card", button: "bg-soft" },
} as const;

// − [ 25 ] +   Typing is free; the minimum is applied when the field loses focus
export function NumberStepper({
  value,
  onChange,
  min = 0,
  step = UNIT_STEP,
  label,
  size = "md",
  surface = "soft",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  label: string;
  size?: "sm" | "md";
  surface?: keyof typeof SURFACES;
}) {
  const [typing, setTyping] = useState<string | null>(null);
  const tone = SURFACES[surface];
  const button = `grid shrink-0 place-items-center rounded-full ${tone.button} transition active:scale-90 disabled:opacity-40 ${
    size === "sm" ? "size-7" : "size-9"
  }`;
  const icon = size === "sm" ? 13 : 15;

  return (
    <div className={`flex items-center justify-between rounded-full p-1 ${tone.box}`}>
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        className={button}
      >
        <Minus size={icon} strokeWidth={2.5} />
      </button>
      <input
        inputMode="numeric"
        aria-label={label}
        value={typing ?? String(value)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
          setTyping(digits);
          onChange(Number(digits) || 0);
        }}
        onBlur={() => {
          setTyping(null);
          if (value < min) onChange(min);
        }}
        className={`min-w-0 bg-transparent text-center font-bold tabular-nums outline-none ${
          size === "sm" ? "w-10 text-sm" : "w-14"
        }`}
      />
      <button
        type="button"
        aria-label={`More ${label}`}
        onClick={() => onChange(value + step)}
        className={button}
      >
        <Plus size={icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// One stepper for plain gifts; a grid of sizes / colours for gifts that come in variants
export function QuantityEditor({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: Quantity;
  onChange: (value: Quantity) => void;
}) {
  const option = product.option;

  if (!option) {
    return (
      <NumberStepper
        label="units"
        value={value.units}
        min={product.minOrder}
        onChange={(units) => onChange({ units })}
      />
    );
  }

  const change = (label: string, units: number) => {
    const variants = setVariant(product, value.variants, label, units);
    onChange({ units: sumUnits(variants), variants });
  };

  return (
    <div className={`grid gap-2 ${option.values.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
      {option.values.map((label) => {
        const units = unitsOf(value.variants, label);
        return (
          <div
            key={label}
            className={`rounded-2xl p-2.5 transition duration-200 ${
              units ? "bg-lime-soft ring-1 ring-lime-deep/50" : "bg-soft/70"
            }`}
          >
            <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold">
              {option.name === "Colour" ? (
                <span
                  aria-hidden
                  className="size-3.5 rounded-full ring-1 ring-ink/15"
                  style={{ background: COLOUR_SWATCH[label] ?? "#ccc" }}
                />
              ) : null}
              {label}
            </p>
            <NumberStepper
              label={`${label} units`}
              size="sm"
              surface="card"
              value={units}
              onChange={(n) => change(label, n)}
            />
          </div>
        );
      })}
    </div>
  );
}
