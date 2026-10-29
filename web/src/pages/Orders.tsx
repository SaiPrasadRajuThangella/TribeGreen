import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  MessageCircle,
  PackageSearch,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Badge, CallbackNumber, CardShell, ItemList, Progress } from "@/components/orders";
import { Button, ButtonLink } from "@/components/ui";
import { formatINR, getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useNow } from "@/hooks/useNow";
import { useSeo } from "@/hooks/useSeo";
import { useTrackedEnquiries } from "@/hooks/useTrackedEnquiries";
import { findEnquiries } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { customerStatus } from "@/lib/orderStatus";
import { daysUntil, formatDate, formatDay, formatTime, relativeDays, replyWindow } from "@/lib/time";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/validation";
import { whatsappUrl } from "@/lib/whatsapp";
import { useMyEnquiries } from "@/store";
import { type Enquiry, type EnquiryLookup, ORDER_STAGES } from "@/types";

const QUOTE_STEPS = ["Enquiry sent", "Quote call", "Order confirmed", "Delivered"];

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
          Quotes and orders sent from this browser, with delivery dates. Open any of them to see every step.
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

// The header row opens the order's own page
function CardHeader({ enquiry: e, label, meta }: { enquiry: Enquiry; label: string; meta: string }) {
  const status = customerStatus(e);
  return (
    <Link
      to={`/orders/${e.id}`}
      className="group flex flex-wrap items-start justify-between gap-3 p-5 transition hover:bg-canvas/50 sm:p-6"
    >
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
          {label} <span className="text-ink">{e.id}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>
      <span className="flex items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="hidden items-center text-sm font-semibold text-muted group-hover:text-ink sm:flex">
          Details <ChevronRight size={16} />
        </span>
      </span>
    </Link>
  );
}

function DetailsLink({ id }: { id: string }) {
  return (
    <Link
      to={`/orders/${id}`}
      className="flex items-center justify-center gap-1.5 border-t border-line py-3.5 text-sm font-semibold text-ink-soft transition hover:bg-canvas/60 hover:text-ink"
    >
      See every step <ArrowRight size={15} />
    </Link>
  );
}

function OrderCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const order = e.order;

  // Marked Converted, but prices and dates are not in yet
  if (!order) {
    return (
      <CardShell>
        <CardHeader
          enquiry={e}
          label="Order"
          meta={`${OCCASION_META[e.occasion].short} · ${e.units} units`}
        />
        <p className="mx-5 mb-2 rounded-2xl bg-lime-soft p-4 text-sm text-lime-ink sm:mx-6">
          Your order is confirmed. The final invoice and delivery date will appear here shortly.
        </p>
        <ItemList items={e.products} />
        <DetailsLink id={e.id} />
      </CardShell>
    );
  }

  const days = daysUntil(order.expectedDelivery, now);

  return (
    <CardShell>
      <CardHeader
        enquiry={e}
        label="Order"
        meta={`Confirmed ${formatDate(order.confirmedAt)} · ${OCCASION_META[e.occasion].short}`}
      />

      <div className="mx-5 rounded-[22px] bg-ink p-5 text-white sm:mx-6">
        <p className="text-xs text-white/60">
          {order.stage === "Dispatched" ? "Arriving by" : "Expected delivery"}
        </p>
        <div className="mt-1 mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {formatDay(order.expectedDelivery)}
          </p>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
            {days < 0 ? "Running late, we'll update you" : relativeDays(days)}
          </span>
        </div>
        {order.trackingNumber ? (
          <p className="mb-5 text-xs text-white/60">
            Tracking no.{" "}
            <span className="font-semibold tracking-wide text-white">{order.trackingNumber}</span>
          </p>
        ) : (
          <div className="mb-5" />
        )}
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

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4 text-sm sm:px-6">
        <a
          href={whatsappUrl(`Hi Tribe Green! I have a question about my order ${e.id}.`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-[#128C4B] hover:underline"
        >
          <MessageCircle size={15} /> Ask about this order
        </a>
      </div>
      <DetailsLink id={e.id} />
    </CardShell>
  );
}

function QuoteCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const contacted = e.status === "Contacted";
  const reply = replyWindow(e.respondBy, now);

  return (
    <CardShell>
      <CardHeader
        enquiry={e}
        label="Enquiry"
        meta={`Sent ${formatDate(e.createdAt)}, ${formatTime(e.createdAt)}`}
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
            <div className="min-w-0 flex-1 text-sm">
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
                  <p className="mt-0.5 text-ink-soft">In about {reply.label}.</p>
                </>
              )}
              <div className="mt-1 text-ink-soft">
                <CallbackNumber enquiry={e} />
              </div>
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
      <DetailsLink id={e.id} />
    </CardShell>
  );
}

// Past orders and cancelled enquiries: the whole row opens the details page
function PastCard({ enquiry: e }: { enquiry: Enquiry }) {
  const delivered = e.order?.stage === "Delivered";
  const status = customerStatus(e);
  return (
    <Link
      to={`/orders/${e.id}`}
      className="group flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-card px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-22px_rgba(18,18,18,0.4)]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wider text-muted">{e.id}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{e.products.map((p) => p.name).join(", ")}</p>
        <p className="mt-0.5 text-xs text-muted">
          {delivered
            ? `Delivered ${formatDay(e.order!.stageTimes?.Delivered ?? e.order!.expectedDelivery)}`
            : (e.closedReason ?? "Closed")}
        </p>
      </div>
      <span className="flex items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <ChevronRight
          size={18}
          className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </span>
    </Link>
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

// "TG-5RT9LP", "tg 5rt9lp", "5RT9LP" → a reference; 10 digits (with or without +91) → a phone number
function parseLookup(raw: string): EnquiryLookup | null {
  const value = raw.trim();
  if (!value) return null;
  if (/[a-z]/i.test(value)) {
    const code = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/^TG/, "");
    return code.length >= 4 ? { id: `TG-${code}` } : null;
  }
  return isValidPhone(value) ? { phone: normalisePhone(value) } : null;
}

type TrackState = { kind: "idle" | "loading" | "invalid" | "missing" } | { kind: "found"; text: string };

// Look up enquiries made on another device: the reference or the mobile number is enough
function TrackForm() {
  const addRefs = useMyEnquiries((s) => s.add);
  const [value, setValue] = useState("");
  const [state, setState] = useState<TrackState>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lookup = parseLookup(value);
    if (!lookup) return setState({ kind: "invalid" });
    setState({ kind: "loading" });
    try {
      const found = await findEnquiries(lookup);
      if (!found.length) return setState({ kind: "missing" });
      addRefs(...found.map((f) => ({ id: f.id, phone: f.phone })));
      setValue("");
      setState({
        kind: "found",
        text:
          "id" in lookup
            ? `Found ${lookup.id}. It's now on this page.`
            : `Found ${found.length} ${found.length === 1 ? "order" : "orders"} for ${formatPhone(lookup.phone)}.`,
      });
    } catch {
      setState({ kind: "missing" });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-[28px] bg-card p-6">
      <p className="font-bold">Track an order</p>
      <p className="mt-1 mb-4 text-sm text-muted">
        Sent from another device? Enter the reference or the mobile number.
      </p>
      <label className="block">
        <span className="sr-only">Reference or mobile number</span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state.kind !== "loading") setState({ kind: "idle" });
          }}
          placeholder="TG-5RT9LP or 98765 43210"
          autoCapitalize="characters"
          className="h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-[15px] transition outline-none placeholder:text-faint focus:border-ink focus:bg-card"
        />
      </label>
      {state.kind === "invalid" ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          Enter a reference like TG-5RT9LP or a 10-digit mobile number.
        </p>
      ) : state.kind === "missing" ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          Nothing found. Check the reference or try the number you used.
        </p>
      ) : state.kind === "found" ? (
        <p role="status" className="mt-3 text-sm font-medium text-lime-ink">
          {state.text}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="dark"
        size="md"
        icon={Search}
        loading={state.kind === "loading"}
        className="mt-4 w-full"
      >
        Find my order
      </Button>
    </form>
  );
}
