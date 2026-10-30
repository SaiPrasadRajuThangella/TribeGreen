import { Check, Pencil, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { CUSTOMISATION_META, formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { changeCallbackNumber } from "@/lib/api";
import { describeVariants } from "@/lib/items";
import type { BadgeTone } from "@/lib/orderStatus";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/validation";
import { useMyOrders } from "@/store";
import type { Enquiry, EnquiryItem } from "@/types";

import { Button } from "./ui";

/* Shared pieces of the My orders list and the order details page */

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    lime: "bg-lime text-ink",
    ink: "bg-ink text-white",
    blue: "bg-[#E2EBF4] text-[#1F4A73]",
    soft: "bg-soft text-ink-soft",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[28px] bg-card"
    >
      {children}
    </motion.article>
  );
}

// Thin segmented progress bar with a label under each step
export function Progress({
  steps,
  current,
  dark,
}: {
  steps: readonly string[];
  current: number;
  dark?: boolean;
}) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} aria-current={i === current ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${done ? "bg-lime" : dark ? "bg-white/15" : "bg-soft"}`}
            />
            <span
              className={`mt-2 block text-[11px] leading-tight font-medium ${
                done ? (dark ? "text-white" : "text-ink") : dark ? "text-white/45" : "text-faint"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function CustomisationTags({ item }: { item: EnquiryItem }) {
  if (!item.customisations?.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {item.customisations.map((c) => {
        const { icon: Icon, short } = CUSTOMISATION_META[c];
        return (
          <span
            key={c}
            title={c}
            className="inline-flex items-center gap-1 rounded-full bg-lime-soft px-2 py-0.5 text-[11px] font-semibold text-lime-ink"
          >
            <Icon size={11} /> {short}
          </span>
        );
      })}
    </span>
  );
}

// Each gift with its sizes / colours, customisation and, for orders, the agreed price
export function ItemList({ items }: { items: (EnquiryItem & { unitPrice?: number })[] }) {
  const { byId } = useProducts();
  return (
    <ul className="divide-y divide-line px-5 sm:px-6">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-4">
          <img
            src={byId.get(item.id)?.images[0]}
            alt=""
            className="size-14 shrink-0 rounded-2xl bg-soft object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{item.name}</p>
            <p className="text-xs text-muted">
              {item.variants?.length ? describeVariants(item.variants) : byId.get(item.id)?.category}
            </p>
            <CustomisationTags item={item} />
          </div>
          {item.unitPrice || item.listPrice ? (
            <div className="text-right">
              <p className="font-semibold tabular-nums">
                {formatINR(item.units * (item.unitPrice ?? item.listPrice ?? 0))}
              </p>
              <p className="text-xs text-muted tabular-nums">
                {item.units} × {formatINR(item.unitPrice ?? item.listPrice ?? 0)}
                {item.unitPrice ? "" : " est."}
              </p>
            </div>
          ) : (
            <p className="shrink-0 text-sm font-semibold tabular-nums">{item.units} units</p>
          )}
        </li>
      ))}
    </ul>
  );
}

// "We'll call +91 98765 43210 · Change number", with an inline editor
export function CallbackNumber({ enquiry, lead = "We'll call" }: { enquiry: Enquiry; lead?: string }) {
  const replace = useMyOrders((s) => s.replace);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(value)) return setError("Enter a valid 10-digit mobile number");
    setSaving(true);
    setError(null);
    try {
      replace(await changeCallbackNumber(enquiry.id, normalisePhone(value)));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span>
        {lead} <span className="font-semibold whitespace-nowrap text-ink">{formatPhone(enquiry.phone)}</span>
        {" · "}
        <button
          type="button"
          onClick={() => {
            setValue(formatPhone(enquiry.phone).replace("+91 ", ""));
            setEditing(true);
          }}
          className="inline-flex items-center gap-1 font-semibold text-lime-ink underline-offset-2 hover:underline"
        >
          <Pencil size={12} /> Change number
        </button>
      </span>
    );
  }

  return (
    <form onSubmit={save} className="mt-2 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-card px-4 focus-within:border-ink">
          <span className="text-sm text-muted">+91</span>
          <span className="sr-only">New mobile number</span>
          <input
            autoFocus
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          />
        </label>
        <Button type="submit" variant="dark" size="md" icon={Check} loading={saving}>
          Save
        </Button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => setEditing(false)}
          className="grid size-11 place-items-center rounded-full bg-card text-muted hover:text-ink"
        >
          <X size={17} />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
