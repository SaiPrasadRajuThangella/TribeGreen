import {
  Check,
  ChevronRight,
  Clock,
  type LucideIcon,
  MessageCircle,
  Package,
  Ruler,
  Send,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { CustomisationPicker } from "@/components/CustomisationPicker";
import { LoadError } from "@/components/LoadError";
import { ProductCard } from "@/components/ProductCard";
import { QuantityEditor } from "@/components/QuantityEditor";
import { Button } from "@/components/ui";
import { formatINR, formatPriceRange, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { shareImageFor, useSeo } from "@/hooks/useSeo";
import { SITE_URL } from "@/lib/config";
import { type Choice, cleanCustomisations, defaultQuantity, estimateFor, quantityProblem } from "@/lib/items";
import { productWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import { useEnquiryList } from "@/store";
import type { Product } from "@/types";

import NotFound from "./NotFound";

export default function ProductPage() {
  const { id = "" } = useParams();
  const { byId, loading, error, retry } = useProducts();
  const product = byId.get(id);

  useSeo({
    title: product?.name ?? "Gift not found",
    description: product
      ? `${product.shortDescription} ${formatPriceRange(product)} per unit. ${product.customisations.join(", ")} available. Minimum order ${product.minOrder} units.`
      : "This gift could not be found.",
    image: product ? shareImageFor(product.images[0]) : undefined,
    path: `/product/${id}`,
    noindex: !product && !loading,
  });

  if (error) {
    return (
      <div className="container-page py-10">
        <LoadError message={error} onRetry={retry} />
      </div>
    );
  }
  if (loading) return <div className="container-page h-[60vh]" />;
  if (!product) return <NotFound />;
  // Keyed so quantities reset when moving to another product
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { products } = useProducts();
  const navigate = useNavigate();
  const { inList: listSet, toggle } = useListToggle();
  const listed = useEnquiryList((s) => s.items.find((i) => i.productId === product.id));
  const put = useEnquiryList((s) => s.put);
  const setOpen = useEnquiryList((s) => s.setOpen);
  const [edited, setEdited] = useState<Choice | null>(null);
  const [shared, setShared] = useState(false);
  const [tried, setTried] = useState(false);

  const similar = useMemo(
    () => products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4),
    [products, product],
  );

  // What the visitor is editing, else what is already in their list, else a fresh start
  const qty: Choice = edited ?? listed ?? defaultQuantity(product);
  const problem = quantityProblem(product, qty);
  const estimate = estimateFor(product, qty.units);
  const inList = !!listed;
  const dirty = edited !== null;
  const optionName = product.option?.name.toLowerCase();

  const pageUrl = `${SITE_URL}/product/${product.id}`;
  const waLink = whatsappUrl(productWhatsAppMessage(product.name, pageUrl));

  const share = async () => {
    const data = { title: product.name, text: `${product.name} from Tribe Green`, url: pageUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(pageUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // The visitor closed the share sheet
    }
  };

  // Saves the quantity to the list; false when it still needs sizes or more units
  const commit = () => {
    if (inList && !dirty) return true;
    if (problem) {
      setTried(true);
      return false;
    }
    put(product.id, {
      units: qty.units,
      variants: qty.variants,
      customisations: cleanCustomisations(product, qty.customisations),
    });
    setEdited(null);
    return true;
  };

  const addToList = () => commit() && setOpen(true);
  const enquireNow = () => commit() && navigate("/enquiry");
  const listLabel = inList ? (dirty ? "Update list" : "In your list · View") : "Add to enquiry list";

  return (
    <>
      <div className="container-page pt-4 pb-28 lg:pb-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link to={`/catalogue?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="relative overflow-hidden rounded-[36px] bg-soft">
              <img
                src={product.images[0].replace("w=900", "w=1400")}
                alt={product.name}
                width={1400}
                height={1400}
                fetchPriority="high"
                className="aspect-square w-full object-cover"
              />
              {product.tag ? (
                <span className="absolute top-5 left-5 rounded-full bg-card/90 px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase backdrop-blur">
                  {product.tag}
                </span>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="rounded-full bg-lime-soft px-3 py-1 text-xs font-semibold text-lime-ink">
              {product.category}
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-[42px]">
              {product.name}
            </h1>
            <p className="mt-3 text-lg text-muted">{product.shortDescription}</p>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-3xl font-extrabold">{formatINR(product.priceMin)}</p>
              <p className="pb-1 text-sm text-muted">– {formatINR(product.priceMax)} per unit, by quantity</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Fact icon={Package} label="Minimum order" value={`${product.minOrder} units`} />
              {product.option ? (
                <Fact
                  icon={Ruler}
                  label={`${product.option.name}s`}
                  value={
                    product.option.name === "Size"
                      ? `${product.option.values[0]} – ${product.option.values.at(-1)}`
                      : `${product.option.values.length} colours`
                  }
                />
              ) : (
                <Fact icon={Clock} label="Lead time" value="7–10 days" />
              )}
            </div>

            {/* Quantity + actions */}
            <div className="mt-6 rounded-[28px] bg-card p-5">
              {product.option ? (
                <>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">Quantity by {optionName}</span>
                    <span className="text-xs text-muted">Mix freely · {product.minOrder} min in total</span>
                  </div>
                  <QuantityEditor
                    product={product}
                    value={qty}
                    onChange={(q) => setEdited({ ...qty, ...q })}
                  />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">Total</span>
                    <span className="font-bold tabular-nums">{qty.units.toLocaleString("en-IN")} units</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Quantity</span>
                  <QuantityEditor
                    product={product}
                    value={qty}
                    onChange={(q) => setEdited({ ...qty, ...q })}
                  />
                </div>
              )}
              <p className="mt-3 text-sm text-muted">
                {qty.units
                  ? `Estimated ${formatINR(estimate.min)} – ${formatINR(estimate.max)}`
                  : `Add units to each ${optionName} you need to see an estimate`}
              </p>
              {problem && (tried || qty.units > 0) ? (
                <p role="alert" className="mt-2 text-sm font-medium text-danger">
                  {problem}
                </p>
              ) : null}

              {/* Customisation belongs to this gift, not the whole enquiry */}
              <div className="mt-5 border-t border-line pt-5">
                <p className="mb-3 text-sm font-semibold">
                  Customise this gift <span className="font-normal text-muted">(optional)</span>
                </p>
                <CustomisationPicker
                  product={product}
                  value={qty.customisations}
                  onChange={(customisations) => setEdited({ ...qty, customisations })}
                />
              </div>
              <div className="mt-5 hidden gap-3 sm:flex">
                <Button
                  variant={inList && !dirty ? "dark" : "primary"}
                  icon={inList && !dirty ? Check : ShoppingBag}
                  className="flex-1"
                  onClick={addToList}
                >
                  {listLabel}
                </Button>
                <Button variant="dark" icon={Send} onClick={enquireNow}>
                  Enquire now
                </Button>
              </div>
              <div className="mt-3 hidden gap-3 sm:flex">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp/10 text-sm font-semibold text-[#128C4B] transition hover:bg-whatsapp/20"
                >
                  <MessageCircle size={18} /> Ask on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition hover:border-ink"
                >
                  {shared ? <Check size={17} /> : <Share2 size={17} />} {shared ? "Link copied" : "Share"}
                </button>
              </div>
            </div>

            <Section title="About this gift">
              <p className="leading-7 text-ink-soft">{product.description}</p>
            </Section>

            <Section title="Perfect for">
              <div className="flex flex-wrap gap-2">
                {product.occasions.map((o) => {
                  const { icon: Icon, short } = OCCASION_META[o];
                  return (
                    <Link
                      key={o}
                      to={`/catalogue?occasion=${encodeURIComponent(o)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-sm font-medium transition hover:border-ink"
                    >
                      <Icon size={15} /> {short}
                    </Link>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        </div>

        {similar.length ? (
          <section className="mt-20">
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} inList={listSet.has(p.id)} onToggleList={toggle} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-line bg-canvas/95 p-3 backdrop-blur sm:hidden">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ask about ${product.name} on WhatsApp`}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-whatsapp"
        >
          <MessageCircle size={22} />
        </a>
        <Button
          variant={inList && !dirty ? "dark" : "primary"}
          icon={inList && !dirty ? Check : ShoppingBag}
          className="flex-1"
          onClick={addToList}
        >
          {inList ? (dirty ? "Update list" : "In your list") : "Add to list"}
        </Button>
        <Button variant="dark" aria-label="Enquire now" className="!px-5" onClick={enquireNow}>
          <Send size={18} />
        </Button>
      </div>
    </>
  );
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-card p-4">
      <Icon size={19} className="text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
