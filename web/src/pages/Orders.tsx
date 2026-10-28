import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageCircle,
  Package,
  PackageSearch,
  Search,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { Button, ButtonLink } from "@/components/ui";
import { formatINR, getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useNow } from "@/hooks/useNow";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useTrackedEnquiries } from "@/hooks/useTrackedEnquiries";
import { trackEnquiries } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { describeVariants } from "@/lib/items";
import { daysUntil, formatDate, formatDay, formatTime, relativeDays, replyWindow } from "@/lib/time";
import { normalisePhone } from "@/lib/validation";
import { whatsappUrl } from "@/lib/whatsapp";
import { useMyEnquiries } from "@/store";
import { type Enquiry, type EnquiryItem, ORDER_STAGES, type OrderStage } from "@/types";

const QUOTE_STEPS = ["Enquiry sent", "Quote call", "Order confirmed", "Delivered"];

const STAGE_ICON: Record<OrderStage, typeof Package> = {
  Confirmed: CheckCircle2,
  "In production": Package,
  Dispatched: Truck,
  Delivered: CheckCircle2,
};

export default function Orders() {
  useSeo({
    title: "My orders",
    description: "Track your Tribe Green quotes and orders, with delivery dates.",
    path: "/orders",
    noindex: true,
  });

  const { enquiries, loading, error } = useTrackedEnquiries();
  const now = useNow();

  const groups = useMemo(() => {
    const current: Enquiry[] = [];
    const quotes: Enquiry[] = [];
    const past: Enquiry[] = [];
    for (const e of enquiries) {
      if (e.status === "Lost" || e.order?.stage === "Delivered") past.push(e);
      else if (e.status === "Converted") current.push(e);
      else quotes.push(e);
    }
    const eta = (e: Enquiry) => e.order?.expectedDelivery ?? e.deliveryDate;
    current.sort((a, b) => eta(a).localeCompare(eta(b)));
    quotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    past.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { current, quotes, past };
  }, [enquiries]);

  return (
    <div className="container-page pt-6 pb-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My orders</h1>
        <p className="mt-2 text-muted">
          Quotes and orders sent from this browser, with delivery dates. This page updates on its own.
        </p>
      </div>

      {/* minmax(0, …) lets long gift names truncate instead of widening the page */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-10">
          {error ? (
            <p role="alert" className="rounded-[24px] bg-danger-soft p-5 text-sm text-danger">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-[28px] bg-card" />
              ))}
            </div>
          ) : enquiries.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {groups.current.length ? (
                <Group title="Current orders" count={groups.current.length}>
                  {groups.current.map((e) => (
                    <OrderCard key={e.id} enquiry={e} now={now} />
                  ))}
                </Group>
              ) : null}
              {groups.quotes.length ? (
                <Group title="Waiting for a quote" count={groups.quotes.length}>
                  {groups.quotes.map((e) => (
                    <QuoteCard key={e.id} enquiry={e} now={now} />
                  ))}
                </Group>
              ) : null}
              {groups.past.length ? (
                <Group title="Past" count={groups.past.length}>
                  {groups.past.map((e) => (
                    <PastCard key={e.id} enquiry={e} />
                  ))}
                </Group>
              ) : null}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <TrackForm />
          <div className="rounded-[28px] bg-ink p-6 text-white">
            <p className="font-bold">Need to change something?</p>
            <p className="mt-1.5 text-sm text-white/65">
              Sizes, quantities or the delivery address. Message us with your reference.
            </p>
            <a
              href={whatsappUrl("Hi Tribe Green! I need help with my order.")}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              <MessageCircle size={17} /> Chat on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        {title}
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-card px-1.5 text-xs">
          {count}
        </span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
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

function CardHeader({
  label,
  id,
  meta,
  badge,
}: {
  label: string;
  id: string;
  meta: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
          {label} <span className="text-ink">{id}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>
      {badge}
    </div>
  );
}

function Badge({ tone, children }: { tone: "lime" | "ink" | "blue" | "soft"; children: React.ReactNode }) {
  const tones = {
    lime: "bg-lime text-ink",
    ink: "bg-ink text-white",
    blue: "bg-[#E2EBF4] text-[#1F4A73]",
    soft: "bg-soft text-ink-soft",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Thin segmented progress bar with a label under each step
function Progress({ steps, current, dark }: { steps: readonly string[]; current: number; dark?: boolean }) {
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

function ItemList({ items }: { items: (EnquiryItem & { unitPrice?: number })[] }) {
  const { byId } = useProducts();
  return (
    <ul className="divide-y divide-line px-5 sm:px-6">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-4">
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
          </div>
          {item.unitPrice ? (
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatINR(item.units * item.unitPrice)}</p>
              <p className="text-xs text-muted tabular-nums">
                {item.units} × {formatINR(item.unitPrice)}
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

function OrderCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const order = e.order;

  // Marked Converted, but prices and dates are not in yet
  if (!order) {
    return (
      <CardShell>
        <CardHeader
          label="Order"
          id={e.id}
          meta={`${OCCASION_META[e.occasion].short} · ${e.units} units`}
          badge={<Badge tone="ink">Confirmed</Badge>}
        />
        <p className="mx-5 mb-2 rounded-2xl bg-lime-soft p-4 text-sm text-lime-ink sm:mx-6">
          Your order is confirmed. The final invoice and delivery date will appear here shortly.
        </p>
        <ItemList items={e.products} />
      </CardShell>
    );
  }

  const days = daysUntil(order.expectedDelivery, now);
  const StageIcon = STAGE_ICON[order.stage];

  return (
    <CardShell>
      <CardHeader
        label="Order"
        id={e.id}
        meta={`Confirmed ${formatDate(order.confirmedAt)} · ${OCCASION_META[e.occasion].short}`}
        badge={
          <Badge tone="lime">
            <StageIcon size={14} /> {order.stage}
          </Badge>
        }
      />

      <div className="mx-5 rounded-[22px] bg-ink p-5 text-white sm:mx-6">
        <p className="text-xs text-white/60">
          {order.stage === "Dispatched" ? "Arriving by" : "Expected delivery"}
        </p>
        <div className="mt-1 mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {formatDay(order.expectedDelivery)}
          </p>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
            {days < 0 ? "Running late, we'll update you" : relativeDays(days)}
          </span>
        </div>
        <Progress steps={ORDER_STAGES} current={ORDER_STAGES.indexOf(order.stage)} dark />
      </div>

      <ItemList items={order.items} />

      <div className="flex items-center justify-between border-t border-line px-5 py-4 sm:px-6">
        <span className="text-sm text-muted">Order total</span>
        <span className="text-lg font-extrabold tabular-nums">{formatINR(order.total)}</span>
      </div>

      {order.note ? (
        <div className="mx-5 mb-5 rounded-2xl bg-lime-soft p-4 text-sm sm:mx-6">
          <p className="font-semibold text-lime-ink">Update from Tribe Green</p>
          <p className="mt-1 text-ink-soft">{order.note}</p>
          <p className="mt-2 text-xs text-muted">
            {formatDate(order.updatedAt)}, {formatTime(order.updatedAt)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm sm:px-6">
        <span className="text-muted">
          {e.customisations.length ? e.customisations.join(", ") : "No customisation"}
        </span>
        <a
          href={whatsappUrl(`Hi Tribe Green! I have a question about my order ${e.id}.`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-[#128C4B] hover:underline"
        >
          <MessageCircle size={15} /> Ask about this order
        </a>
      </div>
    </CardShell>
  );
}

function QuoteCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const contacted = e.status === "Contacted";
  const reply = replyWindow(e.respondBy, now);

  return (
    <CardShell>
      <CardHeader
        label="Enquiry"
        id={e.id}
        meta={`Sent ${formatDate(e.createdAt)}, ${formatTime(e.createdAt)}`}
        badge={contacted ? <Badge tone="blue">Quote shared</Badge> : <Badge tone="soft">Quote coming</Badge>}
      />

      <div className="mx-5 sm:mx-6">
        {contacted ? (
          <div className="rounded-[22px] bg-[#E2EBF4] p-4 text-sm text-[#1F4A73]">
            <p className="font-semibold">We've been in touch with your quote</p>
            <p className="mt-1">
              Once you confirm it, your order and delivery date will show up here as a current order.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-[22px] bg-lime-soft p-4">
            <Clock size={20} className="mt-0.5 shrink-0 text-lime-ink" />
            <div className="text-sm">
              {reply.overdue ? (
                <>
                  <p className="font-semibold">Our team will call you very soon</p>
                  <p className="mt-0.5 text-ink-soft">
                    It's taking a little longer than {REPLY_WITHIN_HOURS} hours. Sorry for the wait.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Expect a call by {formatTime(e.respondBy)}</p>
                  <p className="mt-0.5 text-ink-soft">
                    In about {reply.label}. We'll call {e.phone}.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        <div className="mt-5">
          <Progress steps={QUOTE_STEPS} current={contacted ? 1 : 0} />
        </div>
      </div>

      <div className="mt-2">
        <ItemList items={e.products} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line px-5 py-4 text-sm sm:px-6">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <CalendarDays size={15} /> Needed by{" "}
          <span className="font-semibold text-ink">{formatDay(e.deliveryDate)}</span>
        </span>
        <span className="text-muted">
          Budget <span className="font-semibold text-ink">{getBudgetBand(e.budget)?.label} / unit</span>
        </span>
      </div>
    </CardShell>
  );
}

function PastCard({ enquiry: e }: { enquiry: Enquiry }) {
  const delivered = e.order?.stage === "Delivered";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-card px-5 py-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wider text-muted">{e.id}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{e.products.map((p) => p.name).join(", ")}</p>
      </div>
      {delivered ? (
        <Badge tone="ink">
          <CheckCircle2 size={14} /> Delivered {formatDay(e.order!.expectedDelivery)}
        </Badge>
      ) : (
        <Badge tone="soft">Closed</Badge>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-[28px] bg-card px-6 py-16 text-center">
      <div className="mb-5 grid size-20 place-items-center rounded-full bg-lime-soft">
        <PackageSearch size={30} className="text-lime-ink" strokeWidth={1.8} />
      </div>
      <p className="text-lg font-bold">No orders yet</p>
      <p className="mt-1.5 mb-6 max-w-sm text-sm text-muted">
        Send an enquiry and it shows up here, with a call back within {REPLY_WITHIN_HOURS} hours. Once you
        confirm the quote, you'll see your order and its delivery date.
      </p>
      <ButtonLink to="/catalogue" variant="dark" size="md" iconRight={ArrowRight}>
        Browse gifts
      </ButtonLink>
    </div>
  );
}

// Look up an enquiry made on another device: reference + the phone number used
function TrackForm() {
  const addRef = useMyEnquiries((s) => s.add);
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = { id: id.trim().toUpperCase(), phone: normalisePhone(phone) };
    if (!ref.id || ref.phone.length < 10) return setState("missing");
    setState("loading");
    try {
      const [found] = await trackEnquiries([ref]);
      if (!found) return setState("missing");
      addRef(ref);
      setState("found");
      setId("");
      setPhone("");
    } catch {
      setState("missing");
    }
  };

  const input =
    "h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-[15px] outline-none transition placeholder:text-faint focus:border-ink focus:bg-card";

  return (
    <form onSubmit={submit} noValidate className="rounded-[28px] bg-card p-6">
      <p className="font-bold">Track an order</p>
      <p className="mt-1 mb-4 text-sm text-muted">Sent from another device? Add it with your reference.</p>
      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Reference</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Reference, e.g. TG-5RT9LP"
            autoCapitalize="characters"
            className={`${input} uppercase placeholder:normal-case`}
          />
        </label>
        <label className="block">
          <span className="sr-only">Mobile number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Mobile number used"
            className={input}
          />
        </label>
      </div>
      {state === "missing" ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          No enquiry matches that reference and number.
        </p>
      ) : state === "found" ? (
        <p role="status" className="mt-3 text-sm font-medium text-lime-ink">
          Found it. It's now on this page.
        </p>
      ) : null}
      <Button
        type="submit"
        variant="dark"
        size="md"
        icon={Search}
        loading={state === "loading"}
        className="mt-4 w-full"
      >
        Find my order
      </Button>
    </form>
  );
}
