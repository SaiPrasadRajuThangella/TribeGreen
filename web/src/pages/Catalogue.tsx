import { PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button, Chip } from "@/components/ui";
import { BUDGET_BANDS, getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { activeFilterCount, type Filters, filterProducts, joinCategories } from "@/lib/filter";
import { type BudgetBandId, CATEGORIES, type Category, type Occasion, OCCASIONS } from "@/types";

type Sort = "featured" | "price-asc" | "price-desc";

const isOccasion = (v: string | null): v is Occasion => OCCASIONS.includes(v as Occasion);
const isBudget = (v: string | null): v is BudgetBandId => BUDGET_BANDS.some((b) => b.id === v);

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const { products, loading } = useProducts();
  const { inList, toggle } = useListToggle();
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // The URL is the source of truth, so filtered views can be shared and bookmarked
  const filters: Filters = {
    // ?category=Drinkware&category=Apparel, kept in catalogue order
    categories: CATEGORIES.filter((c) => params.getAll("category").includes(c)),
    occasion: isOccasion(params.get("occasion")) ? (params.get("occasion") as Occasion) : null,
    budget: isBudget(params.get("budget")) ? (params.get("budget") as BudgetBandId) : null,
  };
  const query = params.get("q") ?? "";
  const sort = (params.get("sort") as Sort) || "featured";
  const deferredQuery = useDeferredValue(query);

  const update = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("focus");
          for (const [k, v] of Object.entries(changes)) {
            next.delete(k);
            for (const value of Array.isArray(v) ? v : v ? [v] : []) next.append(k, value);
          }
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const toggleFilter = (key: "occasion" | "budget", value: string) =>
    update({ [key]: filters[key] === value ? null : value });

  // Categories combine: pick one, several, or All to clear them
  const toggleCategory = (c: Category) =>
    update({
      category: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });
  const categoriesKey = filters.categories.join("|");

  useEffect(() => {
    if (params.get("focus")) searchRef.current?.focus();
  }, [params]);

  const results = useMemo(() => {
    const list = filterProducts(products, filters, deferredQuery);
    if (sort === "price-asc") return [...list].sort((a, b) => a.priceMin - b.priceMin);
    if (sort === "price-desc") return [...list].sort((a, b) => b.priceMin - a.priceMin);
    return list;
    // filters is rebuilt from params on every render; depend on the primitive values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categoriesKey, filters.occasion, filters.budget, deferredQuery, sort]);

  const activeCount = activeFilterCount(filters);
  const clearAll = () => update({ category: null, occasion: null, budget: null, q: null });

  const categoryLabel = joinCategories(filters.categories);
  const heading = filters.occasion
    ? `${OCCASION_META[filters.occasion].short} gifts`
    : categoryLabel || "All corporate gifts";

  useSeo({
    title: filters.occasion ? filters.occasion : categoryLabel ? `${categoryLabel} gifts` : "Catalogue",
    description: `Browse ${results.length} corporate gifts${
      categoryLabel ? ` in ${categoryLabel}` : ""
    }${filters.occasion ? ` for ${filters.occasion}` : ""}. Filter by occasion and budget, customise with your logo.`,
    path: "/catalogue",
  });

  const filterPanel = (
    <div className="space-y-7">
      <FilterGroup title="Category" hint="Pick one or more">
        <Chip selected={!filters.categories.length} onClick={() => update({ category: null })}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={filters.categories.includes(c)} onClick={() => toggleCategory(c)}>
            {c}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Occasion">
        {OCCASIONS.map((o) => (
          <Chip
            key={o}
            icon={OCCASION_META[o].icon}
            selected={filters.occasion === o}
            onClick={() => toggleFilter("occasion", o)}
          >
            {OCCASION_META[o].short}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Budget per unit">
        {BUDGET_BANDS.map((b) => (
          <Chip key={b.id} selected={filters.budget === b.id} onClick={() => toggleFilter("budget", b.id)}>
            {b.label}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="container-page pt-6 pb-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">
            {loading ? "Loading gifts…" : `${results.length} of ${products.length} gifts`}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
        </div>
        <div className="flex gap-2.5">
          <label className="flex h-12 flex-1 items-center gap-2.5 rounded-2xl bg-card px-4 ring-ink transition focus-within:ring-2 md:w-80">
            <Search size={18} className="text-muted" aria-hidden />
            <span className="sr-only">Search gifts</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => update({ q: e.target.value || null })}
              placeholder="Search bottles, hoodies, tea…"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
          </label>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative grid size-12 place-items-center rounded-2xl bg-ink text-white lg:hidden"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={19} />
            {activeCount ? (
              <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-lime text-[11px] font-bold text-ink">
                {activeCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* minmax(0, …) keeps the swipeable chip row from stretching the page on phones */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[28px] bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold">Filters</h2>
              {activeCount ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-muted underline hover:text-ink"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            {filterPanel}
          </div>
        </aside>

        <div>
          {/* Category chips + active filters + sort */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 lg:hidden">
              <Chip selected={!filters.categories.length} onClick={() => update({ category: null })}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} selected={filters.categories.includes(c)} onClick={() => toggleCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.occasion ? (
                <ActivePill
                  label={OCCASION_META[filters.occasion].short}
                  onRemove={() => update({ occasion: null })}
                />
              ) : null}
              {filters.budget ? (
                <ActivePill
                  label={getBudgetBand(filters.budget)!.label}
                  onRemove={() => update({ budget: null })}
                />
              ) : null}
            </div>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Sort
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
                className="h-10 rounded-full border border-line bg-card px-3 text-sm font-medium text-ink outline-none focus:border-ink"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] bg-card px-6 py-20 text-center">
              <div className="mb-5 grid size-20 place-items-center rounded-full bg-lime-soft">
                <PackageSearch size={30} className="text-lime-ink" strokeWidth={1.8} />
              </div>
              <p className="text-lg font-bold">No gifts match</p>
              <p className="mt-1.5 mb-6 max-w-xs text-sm text-muted">
                Try a different search or clear a filter to see more of the catalogue.
              </p>
              <Button variant="dark" size="md" onClick={clearAll}>
                Clear filters
              </Button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductCard product={p} inList={inList.has(p.id)} onToggleList={toggle} eager={i < 4} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {sheetOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[32px] bg-canvas px-5 pt-3 pb-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="grid size-10 place-items-center rounded-full bg-card"
                >
                  <X size={18} />
                </button>
              </div>
              {filterPanel}
              <div className="mt-8 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearAll}>
                  Reset
                </Button>
                <Button variant="dark" className="flex-[2]" onClick={() => setSheetOpen(false)}>
                  Show {results.length} {results.length === 1 ? "gift" : "gifts"}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-muted">
        {title}
        {hint ? <span className="ml-2 text-xs font-normal text-faint">{hint}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="inline-flex items-center gap-1 rounded-full bg-lime-soft py-1.5 pr-2 pl-3 text-xs font-medium text-lime-ink transition hover:bg-lime"
    >
      {label} <X size={13} strokeWidth={2.4} />
    </button>
  );
}
