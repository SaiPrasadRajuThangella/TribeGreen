import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";

import { formatINR, formatPriceRange } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useEnquiryList } from "@/store";

import { Button } from "./ui";

const STEP = 5;

// Slide-over panel with everything the visitor added for a quote
export function ListDrawer() {
  const open = useEnquiryList((s) => s.open);
  const setOpen = useEnquiryList((s) => s.setOpen);
  const items = useEnquiryList((s) => s.items);
  const setUnits = useEnquiryList((s) => s.setUnits);
  const remove = useEnquiryList((s) => s.remove);
  const { byId } = useProducts();
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      items.flatMap((item) =>
        byId.get(item.productId) ? [{ item, product: byId.get(item.productId)! }] : [],
      ),
    [items, byId],
  );
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, { item, product }) => ({
          units: acc.units + item.units,
          min: acc.min + item.units * product.priceMin,
          max: acc.max + item.units * product.priceMax,
        }),
        { units: 0, min: 0, max: 0 },
      ),
    [rows],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Enquiry list"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-xl font-extrabold">Enquiry list</h2>
                <p className="text-sm text-muted">
                  {rows.length} {rows.length === 1 ? "gift" : "gifts"} for one quote
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close enquiry list"
                className="grid size-10 place-items-center rounded-full bg-card hover:bg-soft"
              >
                <X size={18} />
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
                <div className="mb-5 grid size-20 place-items-center rounded-full bg-lime-soft">
                  <ShoppingBag size={30} className="text-lime-ink" strokeWidth={1.8} />
                </div>
                <p className="text-lg font-bold">Your list is empty</p>
                <p className="mt-1.5 mb-6 text-sm text-muted">
                  Add the gifts you like and we'll send one quote for all of them.
                </p>
                <Button
                  variant="dark"
                  size="md"
                  onClick={() => {
                    setOpen(false);
                    navigate("/catalogue");
                  }}
                >
                  Browse catalogue
                </Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
                  <AnimatePresence initial={false}>
                    {rows.map(({ item, product }) => (
                      <motion.li
                        key={product.id}
                        layout
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-3 rounded-3xl bg-card p-2.5"
                      >
                        <Link
                          to={`/product/${product.id}`}
                          onClick={() => setOpen(false)}
                          className="shrink-0"
                        >
                          <img
                            src={product.images[0]}
                            alt=""
                            className="size-20 rounded-2xl bg-soft object-cover"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{product.name}</p>
                              <p className="text-xs text-muted">{formatPriceRange(product)} / unit</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(product.id)}
                              aria-label={`Remove ${product.name}`}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-full bg-soft p-1">
                              <Stepper
                                label="Decrease units"
                                disabled={item.units <= product.minOrder}
                                onClick={() =>
                                  setUnits(product.id, Math.max(product.minOrder, item.units - STEP))
                                }
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </Stepper>
                              <span className="min-w-11 text-center text-sm font-bold tabular-nums">
                                {item.units}
                              </span>
                              <Stepper
                                label="Increase units"
                                onClick={() => setUnits(product.id, item.units + STEP)}
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </Stepper>
                            </div>
                            <span className="text-xs text-faint">units</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-line bg-card px-6 pt-5 pb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Total units</span>
                    <span className="font-semibold tabular-nums">{totals.units.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-sm text-muted">Estimated budget</span>
                    <span className="text-right">
                      <span className="block text-xl font-extrabold tabular-nums">
                        {formatINR(totals.min)}
                      </span>
                      <span className="text-xs text-muted">up to {formatINR(totals.max)}</span>
                    </span>
                  </div>
                  <Button
                    variant="dark"
                    iconRight={ArrowRight}
                    className="mt-5 w-full"
                    onClick={() => {
                      setOpen(false);
                      navigate("/enquiry");
                    }}
                  >
                    Continue to enquiry
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Stepper({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-7 place-items-center rounded-full bg-card transition active:scale-90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
