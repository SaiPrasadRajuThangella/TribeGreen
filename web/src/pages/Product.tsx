import {
  Check,
  ChevronRight,
  Clock,
  type LucideIcon,
  MessageCircle,
  Minus,
  Package,
  PenTool,
  Plus,
  Send,
  Share2,
  ShoppingBag,
  Stamp,
  Type,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ProductCard } from "@/components/ProductCard";
import { Button, ButtonLink } from "@/components/ui";
import { formatINR, formatPriceRange, OCCASION_META } from "@/data/catalog";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { shareImageFor, useSeo } from "@/hooks/useSeo";
import { SITE_URL } from "@/lib/config";
import { productWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import { useEnquiryList } from "@/store";
import { type Customisation, CUSTOMISATIONS } from "@/types";

import NotFound from "./NotFound";

const CUSTOM_ICONS: Record<Customisation, LucideIcon> = {
  "Logo printing": Stamp,
  "Laser engraving": PenTool,
  "Name personalisation": Type,
};

export default function ProductPage() {
  const { id = "" } = useParams();
  const { products, byId, loading } = useProducts();
  const product = byId.get(id);
  const navigate = useNavigate();
  const { inList: listSet, toggle } = useListToggle();
  const inList = useEnquiryList((s) => s.items.some((i) => i.productId === id));
  const add = useEnquiryList((s) => s.add);
  const setOpen = useEnquiryList((s) => s.setOpen);
  const [units, setUnits] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  useSeo({
    title: product?.name ?? "Gift not found",
    description: product
      ? `${product.shortDescription} ${formatPriceRange(product)} per unit. ${product.customisations.join(", ")} available. Minimum order ${product.minOrder} units.`
      : "This gift could not be found.",
    image: product ? shareImageFor(product.images[0]) : undefined,
    path: `/product/${id}`,
    noindex: !product && !loading,
  });

  const similar = useMemo(
    () =>
      product
        ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
        : [],
    [products, product],
  );

  if (loading) return <div className="container-page h-[60vh]" />;
  if (!product) return <NotFound />;

  const qty = units ?? product.minOrder;
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

  const addToList = () => {
    if (inList) return setOpen(true);
    add(product.id, qty);
    setOpen(true);
  };

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
              <Fact icon={Clock} label="Lead time" value="7–10 days" />
            </div>

            {/* Quantity + actions */}
            <div className="mt-6 rounded-[28px] bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center rounded-full bg-soft p-1">
                  <QtyButton
                    label="Decrease quantity"
                    disabled={qty <= product.minOrder}
                    onClick={() => setUnits(Math.max(product.minOrder, qty - 5))}
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </QtyButton>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={product.minOrder}
                    aria-label="Quantity in units"
                    value={qty}
                    onChange={(e) => setUnits(Math.max(1, Number(e.target.value) || 0))}
                    onBlur={() => setUnits(Math.max(product.minOrder, qty))}
                    className="w-16 [appearance:textfield] bg-transparent text-center font-bold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <QtyButton label="Increase quantity" onClick={() => setUnits(qty + 5)}>
                    <Plus size={15} strokeWidth={2.5} />
                  </QtyButton>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">
                Estimated {formatINR(qty * product.priceMin)} – {formatINR(qty * product.priceMax)}
              </p>
              <div className="mt-5 hidden gap-3 sm:flex">
                <Button
                  variant={inList ? "dark" : "primary"}
                  icon={inList ? Check : ShoppingBag}
                  className="flex-1"
                  onClick={addToList}
                >
                  {inList ? "In your list · View" : "Add to enquiry list"}
                </Button>
                <ButtonLink to={`/enquiry?product=${product.id}&units=${qty}`} variant="dark" icon={Send}>
                  Enquire now
                </ButtonLink>
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

            <Section title="Make it yours">
              <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-card">
                {CUSTOMISATIONS.map((c) => {
                  const Icon = CUSTOM_ICONS[c];
                  const available = product.customisations.includes(c);
                  return (
                    <li key={c} className="flex items-center gap-3 px-5 py-4">
                      <span
                        className={`grid size-10 place-items-center rounded-full ${
                          available ? "bg-lime-soft text-lime-ink" : "bg-soft text-faint"
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <span className={`flex-1 font-medium ${available ? "" : "text-faint"}`}>{c}</span>
                      <span className={`text-sm font-medium ${available ? "text-lime-ink" : "text-faint"}`}>
                        {available ? "Available" : "Not offered"}
                      </span>
                    </li>
                  );
                })}
              </ul>
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
          variant={inList ? "dark" : "primary"}
          icon={inList ? Check : ShoppingBag}
          className="flex-1"
          onClick={addToList}
        >
          {inList ? "In your list" : "Add to list"}
        </Button>
        <Button
          variant="dark"
          aria-label="Enquire now"
          className="!px-5"
          onClick={() => navigate(`/enquiry?product=${product.id}&units=${qty}`)}
        >
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

function QtyButton({
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
      className="grid size-9 place-items-center rounded-full bg-card transition active:scale-90 disabled:opacity-40"
    >
      {children}
    </button>
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
