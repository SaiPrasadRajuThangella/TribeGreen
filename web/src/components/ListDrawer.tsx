import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

import { formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useScrollLock } from "@/hooks/useScrollLock";
import { quantityProblem } from "@/lib/items";
import { useEnquiryList } from "@/store";

import { GiftRow } from "./GiftRow";
import { Button } from "./ui";

// Slide-over panel with everything the visitor added for a quote
export function ListDrawer() {
  const open = useEnquiryList((s) => s.open);
  const setOpen = useEnquiryList((s) => s.setOpen);
  const items = useEnquiryList((s) => s.items);
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

  const needsAttention = rows.some(({ item, product }) => quantityProblem(product, item));

  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    // Escape closes the size picker first when it is open on top
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !useEnquiryList.getState().editing && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
                      <motion.li key={product.id} layout exit={{ opacity: 0, x: 40 }}>
                        <GiftRow item={item} product={product} onNavigate={() => setOpen(false)} />
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
                  {needsAttention ? (
                    <p className="mt-3 text-xs text-danger">
                      Finish choosing quantities for the marked gifts.
                    </p>
                  ) : null}
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
