import { ArrowLeft, Check, Copy, MessageCircle, PackageSearch, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Badge, CallbackNumber, ItemList } from "@/components/orders";
import { ButtonLink } from "@/components/ui";
import { CUSTOMISATION_META, formatINR, getBudgetBand } from "@/data/catalog";
import { useNow } from "@/hooks/useNow";
import { useSeo } from "@/hooks/useSeo";
import { useOrdersFeed } from "@/hooks/useOrdersFeed";
import { customerStatus } from "@/lib/orderStatus";
import { daysUntil, formatDate, formatDay, formatTime, relativeDays, replyWindow } from "@/lib/time";
import { formatPhone } from "@/lib/validation";
import { whatsappUrl } from "@/lib/whatsapp";
import { type Enquiry, ORDER_STAGES, type OrderStage } from "@/types";

type StepState = "done" | "current" | "upcoming" | "cancelled";
type Step = { key: string; title: string; at?: string; state: StepState; lines: React.ReactNode[] };

const STAGE_COPY: Record<OrderStage, { done: string; upcoming: string }> = {
  Confirmed: {
    done: "Your order is confirmed.",
    upcoming: "Confirm the quote with our team to place the order.",
  },
  "In production": {
    done: "Your gifts are being customised and packed.",
    upcoming: "Customisation and packing start once the order is confirmed.",
  },
  Dispatched: { done: "On its way to you.", upcoming: "We'll share the courier details here." },
  Delivered: { done: "Delivered. We hope everyone loved them!", upcoming: "" },
};

// Every phase of an enquiry, from "sent" to "delivered" (or "cancelled")
function buildSteps(e: Enquiry, now: number): Step[] {
  const order = e.order;
  const called = !!(e.contactedAt || order || e.status === "Contacted" || e.status === "Converted");
  const reply = replyWindow(e.respondBy, now);

  const steps: Step[] = [
    {
      key: "sent",
      title: "Enquiry sent",
      at: e.createdAt,
      state: "done",
      lines: [
        `${e.products.length} ${e.products.length === 1 ? "gift" : "gifts"}, ${e.units.toLocaleString("en-IN")} units in total`,
        `Needed by ${formatDay(e.deliveryDate)}`,
      ],
    },
    {
      key: "call",
      title: "Quote call",
      at: e.contactedAt,
      state: called ? "done" : "upcoming",
      lines: called
        ? ["We called you with a tailored quote."]
        : [
            reply.overdue
              ? "Taking a little longer than promised. Our team will call you very soon."
              : `Expect a call by ${formatTime(e.respondBy)}, in about ${reply.label}.`,
            <CallbackNumber key="phone" enquiry={e} />,
          ],
    },
  ];

  const reached = order ? ORDER_STAGES.indexOf(order.stage) : -1;
  ORDER_STAGES.forEach((stage, i) => {
    const done = i <= reached;
    const copy = STAGE_COPY[stage];
    const lines: React.ReactNode[] = [done ? copy.done : copy.upcoming];
    if (order && stage === "Confirmed" && done) {
      lines.push(`Order total ${formatINR(order.total)}`);
      if (order.trackingNumber) lines.push(`Tracking number ${order.trackingNumber}`);
    }
    if (order && stage === "Dispatched" && done && order.trackingNumber) {
      lines.push(`Tracking number ${order.trackingNumber}`);
    }
    if (order && stage === "Delivered" && !done) lines[0] = `Expected ${formatDay(order.expectedDelivery)}.`;
    // The team's latest note sits on the stage the order is at now
    if (order?.note && stage === order.stage) {
      lines.push(
        <span key="note" className="mt-1 block rounded-xl bg-lime-soft px-3 py-2 text-ink-soft">
          “{order.note}”
        </span>,
      );
    }
    steps.push({
      key: stage,
      title: stage === "Confirmed" ? "Order confirmed" : stage,
      at: done
        ? (order?.stageTimes?.[stage] ?? (stage === "Confirmed" ? order?.confirmedAt : undefined))
        : undefined,
      state: done ? "done" : "upcoming",
      lines: lines.filter(Boolean),
    });
  });

  if (e.status === "Lost") {
    // Keep what happened, then the cancellation; drop the steps that never will
    const kept = steps.filter((s) => s.state === "done");
    kept.push({
      key: "cancelled",
      title: "Cancelled",
      at: e.closedAt,
      state: "cancelled",
      lines: [
        e.closedReason ?? "This enquiry was closed.",
        "Chat with us if you'd like to pick it up again.",
      ],
    });
    return kept;
  }

  // The first step not done yet is where things stand now
  const next = steps.find((s) => s.state === "upcoming");
  if (next) next.state = "current";
  return steps;
}

export default function OrderDetail() {
  const { id = "" } = useParams();
  const { enquiries, loading } = useOrdersFeed();
  const now = useNow();
  const e = enquiries.find((x) => x.id === id);

  useSeo({
    title: e?.order ? `Order ${id}` : `Enquiry ${id}`,
    description: "Every step of your Tribe Green order.",
    path: `/orders/${id}`,
    noindex: true,
  });

  if (loading) {
    return (
      <div className="container-page space-y-4 pt-6 pb-10">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-card" />
        <div className="h-96 animate-pulse rounded-[28px] bg-card" />
      </div>
    );
  }

  if (!e) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <div className="mb-5 grid size-20 place-items-center rounded-full bg-lime-soft">
          <PackageSearch size={30} className="text-lime-ink" strokeWidth={1.8} />
        </div>
        <p className="text-lg font-bold">We can't find {id} on your account</p>
        <p className="mt-1.5 mb-6 max-w-sm text-sm text-muted">
          Orders show up for the mobile number they were made with. Check you're signed in with that number.
        </p>
        <ButtonLink to="/orders" variant="dark" size="md">
          Go to My orders
        </ButtonLink>
      </div>
    );
  }

  const order = e.order;
  const steps = buildSteps(e, now);
  const status = customerStatus(e);

  return (
    <div className="container-page pt-6 pb-10">
      <Link
        to="/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={15} /> My orders
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            {order ? "Order" : "Enquiry"} <span className="text-ink">{e.id}</span>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{headline(e)}</h1>
          <p className="mt-1 text-muted">
            {e.company} · sent {formatDate(e.createdAt)}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-[28px] bg-card p-6 sm:p-7">
            <h2 className="mb-6 text-lg font-bold">Every step</h2>
            <Timeline steps={steps} />
          </section>

          <section className="overflow-hidden rounded-[28px] bg-card">
            <h2 className="px-6 pt-6 text-lg font-bold sm:px-7">Gifts</h2>
            <ItemList items={order?.items ?? e.products} />
            <div className="flex items-center justify-between border-t border-line px-5 py-4 sm:px-6">
              <span className="text-sm text-muted">{order ? "Order total" : "Total units"}</span>
              <span className="text-lg font-extrabold tabular-nums">
                {order ? formatINR(order.total) : e.units.toLocaleString("en-IN")}
              </span>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {order && e.status !== "Lost" ? <DeliveryCard enquiry={e} now={now} /> : null}

          <dl className="divide-y divide-line rounded-[28px] bg-card px-6 text-sm">
            <Row label="Occasion" value={e.occasion} />
            <Row label="Budget" value={`${getBudgetBand(e.budget)?.label} / unit`} />
            <Row label="Needed by" value={formatDay(e.deliveryDate)} />
            <Row
              label="Customisation"
              value={
                e.customisations.length
                  ? e.customisations.map((c) => CUSTOMISATION_META[c].short).join(", ")
                  : "None"
              }
            />
            <Row label="Contact" value={e.name} />
            <Row label="Phone" value={formatPhone(e.phone)} />
            <Row label="Email" value={e.email} />
            {e.message ? <Row label="Message" value={e.message} /> : null}
          </dl>

          <a
            href={whatsappUrl(`Hi Tribe Green! I have a question about ${e.id}.`)}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-semibold text-white transition hover:brightness-95"
          >
            <MessageCircle size={17} /> Ask about this {order ? "order" : "enquiry"}
          </a>
        </aside>
      </div>
    </div>
  );
}

function headline(e: Enquiry) {
  const order = e.order;
  if (e.status === "Lost") return "Cancelled";
  if (order?.stage === "Delivered")
    return `Delivered ${formatDay(order.stageTimes?.Delivered ?? order.expectedDelivery)}`;
  if (order?.stage === "Dispatched") return `Arriving by ${formatDay(order.expectedDelivery)}`;
  if (order) return `Expected ${formatDay(order.expectedDelivery)}`;
  if (e.status === "Contacted") return "Quote shared";
  return `Call by ${formatTime(e.respondBy)}`;
}

function DeliveryCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const order = e.order!;
  const [copied, setCopied] = useState(false);
  const delivered = order.stage === "Delivered";
  const days = daysUntil(order.expectedDelivery, now);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the number is still on screen
    }
  };

  return (
    <div className="rounded-[28px] bg-ink p-6 text-white">
      <p className="text-xs text-white/60">{delivered ? "Delivered" : "Expected delivery"}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">
        {formatDay(
          delivered ? (order.stageTimes?.Delivered ?? order.expectedDelivery) : order.expectedDelivery,
        )}
      </p>
      {!delivered ? (
        <p className="mt-2 inline-block rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
          {days < 0 ? "Running late, we'll update you" : relativeDays(days)}
        </p>
      ) : null}
      {order.trackingNumber ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
          <div>
            <p className="text-[11px] text-white/60">Tracking number</p>
            <p className="font-bold tracking-wide">{order.trackingNumber}</p>
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy tracking number"
            className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-current={s.state === "current" ? "step" : undefined}
            className="relative flex gap-4 pb-7 last:pb-0"
          >
            {!last ? (
              <span
                aria-hidden
                className={`absolute top-9 bottom-1 left-[15px] w-0.5 rounded-full ${
                  s.state === "done" ? "bg-lime-deep" : "bg-line"
                }`}
              />
            ) : null}
            <Dot state={s.state} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className={`font-semibold ${s.state === "upcoming" ? "text-faint" : ""}`}>{s.title}</p>
                {s.at ? (
                  <p className="text-xs text-muted tabular-nums">
                    {formatDate(s.at)}, {formatTime(s.at)}
                  </p>
                ) : s.state === "current" ? (
                  <span className="text-xs font-semibold text-lime-ink">Up next</span>
                ) : null}
              </div>
              <div
                className={`mt-1 space-y-1 text-sm ${s.state === "upcoming" ? "text-faint" : "text-muted"}`}
              >
                {s.lines.map((line, j) => (
                  <div key={j}>{line}</div>
                ))}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function Dot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-lime">
        <Check size={15} strokeWidth={3} />
      </span>
    );
  }
  if (state === "cancelled") {
    return (
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
        <X size={15} strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-ink">
        <span className="absolute inset-0 animate-ping rounded-full bg-ink/25" />
        <span className="size-2.5 rounded-full bg-lime" />
      </span>
    );
  }
  return <span className="relative z-10 size-8 shrink-0 rounded-full border-2 border-line bg-card" />;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
    </div>
  );
}
