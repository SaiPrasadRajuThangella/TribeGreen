import { ArrowRight, ArrowUpRight, PackageCheck, Palette, Send, Sparkles, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Link } from "react-router";

import { LoadError } from "@/components/LoadError";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { CATEGORY_META, OCCASION_META } from "@/data/catalog";
import { BANNER_IMAGES } from "@/data/products";
import { useListToggle } from "@/hooks/useListToggle";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { CATEGORIES, OCCASIONS } from "@/types";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

const STEPS = [
  {
    icon: Sparkles,
    title: "Pick your gifts",
    body: "Browse the catalogue and add everything you like to one enquiry list.",
  },
  {
    icon: Palette,
    title: "Make it yours",
    body: "Tell us about your logo, engraving or names. We send a mock-up first.",
  },
  {
    icon: Send,
    title: "A call back in 2 hrs",
    body: "Our gifting team calls back with pricing for your quantity and dates.",
  },
  {
    icon: Truck,
    title: "Delivered to every desk",
    body: "Packed, branded and shipped to offices or homes across India.",
  },
];

export default function Home() {
  useSeo({
    title: "Tribe Green",
    description:
      "Welcome kits, festive hampers and branded merchandise for companies across India. Customised with your logo and delivered to every desk.",
    path: "/",
  });

  const { products, loading, error, retry } = useProducts();
  const { inList, toggle } = useListToggle();
  // Tagged gifts first, topped up to a full two rows of four
  const featured = useMemo(
    () => [...products.filter((p) => p.tag), ...products.filter((p) => !p.tag)].slice(0, 8),
    [products],
  );

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 pb-16 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold">
              <span className="size-2 rounded-full bg-lime-deep" /> Festive 2026 collection is live
            </span>
            <h1 className="mt-5 text-[40px] leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-[68px]">
              Corporate gifts
              <br />
              your team will{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">actually love.</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-full bg-lime sm:bottom-2 sm:h-5" />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              Welcome kits, festive hampers and branded merchandise, customised with your logo and delivered
              across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/catalogue" variant="dark" iconRight={ArrowRight}>
                Browse catalogue
              </ButtonLink>
              <ButtonLink to="/enquiry" variant="outline">
                Request a quote
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ["500+", "brands gifted"],
                ["2 hrs", "call-back time"],
                ["10 units", "minimum order"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-extrabold">{value}</dd>
                  <dd className="text-xs text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[40px] bg-lime">
              <img
                src={BANNER_IMAGES.hero}
                alt="A curated gift hamper with a candle, notebook and ribbon"
                width={1200}
                height={1200}
                fetchPriority="high"
                className="aspect-[4/4.2] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-3xl bg-card p-3 pr-5 shadow-[0_20px_40px_-20px_rgba(18,18,18,0.3)] sm:left-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-lime-soft">
                <PackageCheck size={20} className="text-lime-ink" />
              </span>
              <span>
                <span className="block text-sm font-bold">Logo on every gift</span>
                <span className="text-xs text-muted">Printing, engraving and names</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <motion.div {...fadeUp}>
          <SectionHeading eyebrow="Shop by category" title="Gifts for every kind of team" />
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const { icon: Icon, tint } = CATEGORY_META[c];
            const count = products.filter((p) => p.category === c).length;
            return (
              <motion.div key={c} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
                <Link
                  to={`/catalogue?category=${encodeURIComponent(c)}`}
                  className="group flex h-full flex-col justify-between rounded-[28px] p-5 transition duration-300 ease-spring hover:-translate-y-1 sm:p-6"
                  style={{ backgroundColor: tint }}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-card/80">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="mt-10 flex items-end justify-between gap-2">
                    <span>
                      <span className="block text-lg font-bold">{c}</span>
                      <span className="text-sm text-muted">{count} gifts</span>
                    </span>
                    <span className="grid size-9 place-items-center rounded-full bg-ink text-white transition group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page py-12">
        <motion.div {...fadeUp}>
          <SectionHeading
            eyebrow="Bestsellers and new arrivals"
            title="Loved by HR teams"
            action={
              <Link
                to="/catalogue"
                className="hidden text-sm font-semibold underline-offset-4 hover:underline sm:block"
              >
                View all gifts
              </Link>
            }
          />
        </motion.div>
        {error ? (
          <LoadError message={error} onRetry={retry} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p) => (
                  <ProductCard key={p.id} product={p} inList={inList.has(p.id)} onToggleList={toggle} />
                ))}
          </div>
        )}
      </section>

      {/* Occasions */}
      <section className="container-page py-12">
        <div className="rounded-[40px] bg-ink px-6 py-12 text-white sm:px-12">
          <motion.div {...fadeUp} className="mb-8 max-w-xl">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-lime uppercase">
              Gift by occasion
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              From day-one welcome kits to Diwali hampers
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {OCCASIONS.map((o) => {
              const { icon: Icon, short } = OCCASION_META[o];
              return (
                <Link
                  key={o}
                  to={`/catalogue?occasion=${encodeURIComponent(o)}`}
                  className="group flex items-center gap-3 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-lime hover:text-ink hover:ring-lime"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lime transition group-hover:bg-ink">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{short}</span>
                    <span className="hidden truncate text-xs text-faint group-hover:text-ink-soft sm:block">
                      {o}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-12">
        <motion.div {...fadeUp}>
          <SectionHeading eyebrow="How it works" title="Gifting without the spreadsheets" />
        </motion.div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <motion.li
              key={title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="rounded-[28px] bg-card p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft">
                  <Icon size={21} className="text-lime-ink" />
                </span>
                <span className="text-sm font-bold text-faint">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="container-page py-12">
        <motion.div
          {...fadeUp}
          className="grid items-center overflow-hidden rounded-[40px] bg-lime md:grid-cols-[1.2fr_1fr]"
        >
          <div className="p-8 sm:p-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Planning Diwali gifts for 2026?
            </h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Share your headcount and budget. We'll call you back with a festive shortlist within 2 hours.
            </p>
            <ButtonLink to="/enquiry" variant="dark" iconRight={ArrowRight} className="mt-7">
              Start an enquiry
            </ButtonLink>
          </div>
          <img
            src={BANNER_IMAGES.diwali}
            alt="Kraft gift boxes tied with twine"
            loading="lazy"
            className="h-full max-h-80 w-full object-cover md:max-h-none"
          />
        </motion.div>
      </section>
    </>
  );
}
