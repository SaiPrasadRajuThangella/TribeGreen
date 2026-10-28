import { Check, Plus } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";

import { formatINR } from "@/data/catalog";
import type { Product } from "@/types";

type Props = {
  product: Product;
  inList: boolean;
  onToggleList: (id: string) => void;
  eager?: boolean;
};

// The whole card is one link (stretched ::after), with the add button layered above it
export const ProductCard = memo(function ProductCard({ product, inList, onToggleList, eager }: Props) {
  return (
    <article className="group relative flex flex-col rounded-[28px] bg-card p-2 transition duration-300 ease-spring hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(18,18,18,0.35)]">
      <div className="relative overflow-hidden rounded-[22px] bg-soft">
        <img
          src={product.images[0]}
          alt={product.name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={600}
          height={600}
          className="aspect-square w-full object-cover transition duration-700 ease-spring group-hover:scale-105"
        />
        {product.tag ? (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur">
            {product.tag}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-3 pb-2">
        <p className="text-xs text-muted">{product.category}</p>
        <h3 className="mt-0.5 truncate text-[15px] font-semibold">
          <Link to={`/product/${product.id}`} className="after:absolute after:inset-0 after:rounded-[28px]">
            {product.name}
          </Link>
        </h3>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[15px] font-bold">{formatINR(product.priceMin)}</p>
            <p className="text-[11px] text-faint">
              onwards / unit
              {product.option
                ? ` · ${product.option.values.length} ${product.option.name.toLowerCase()}s`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleList(product.id)}
            aria-label={
              inList ? `Remove ${product.name} from enquiry list` : `Add ${product.name} to enquiry list`
            }
            aria-pressed={inList}
            className={`relative z-10 grid size-10 place-items-center rounded-full transition duration-200 ease-spring active:scale-90 ${
              inList ? "bg-lime text-ink" : "bg-ink text-white hover:bg-ink-soft"
            }`}
          >
            {inList ? <Check size={17} strokeWidth={2.6} /> : <Plus size={17} strokeWidth={2.6} />}
          </button>
        </div>
      </div>
    </article>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] bg-card p-2">
      <div className="aspect-square rounded-[22px] bg-soft" />
      <div className="space-y-2 px-2 pt-3 pb-2">
        <div className="h-3 w-16 rounded bg-soft" />
        <div className="h-4 w-3/4 rounded bg-soft" />
        <div className="h-4 w-1/3 rounded bg-soft" />
      </div>
    </div>
  );
}
