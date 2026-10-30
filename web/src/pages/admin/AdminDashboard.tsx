import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Globe,
  LogOut,
  Mail,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  ThumbsDown,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui";
import { COLOUR_SWATCH, customisationMeta, formatINR, getBudgetBand, occasionMeta } from "@/data/catalog";
import { useLists } from "@/hooks/useLists";
import { useNow } from "@/hooks/useNow";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { ApiError, finaliseOrder, getEnquiries, updateEnquiryStatus, updateOrder } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import { describeVariants, enquiryEstimate } from "@/lib/items";
import { unitPrice } from "@/lib/pricing";
import { formatDay, formatTime, replyWindow } from "@/lib/time";
import { useAuth } from "@/store";
import {
  type Enquiry,
  type EnquiryItem,
  type EnquiryStatus,
  nextStage,
  type OrderItem,
  type OrderStage,
} from "@/types";

// Status names come from the API; a status added there later gets a plain style
const STATUS_STYLE: Record<EnquiryStatus, string> = {
  New: "bg-lime-soft text-lime-ink",
  Contacted: "bg-[#E2EBF4] text-[#1F4A73]",
  Converted: "bg-ink text-white",
  Lost: "bg-danger-soft text-danger",
};
const statusStyle = (s: EnquiryStatus) => STATUS_STYLE[s] ?? "bg-soft text-ink";

type SourceFilter = "all" | "website" | "app";

const formatDate = (iso: string, time = true) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    ...(time ? { hour: "numeric", minute: "2-digit" } : { year: "numeric" }),
  });

export default function AdminDashboard() {
  useSeo({ title: "Enquiries", description: "Tribe Green admin dashboard.", noindex: true });

  const token = useAuth((s) => s.token)!;
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setLoading] = useState(true);
  const [enquiriesError, setError] = useState<string | null>(null);
  // Status and order-stage names for the filters, selects and stage controls
  const { lists, loading: listsLoading, error: listsError, retry: retryLists } = useLists();
  const loading = enquiriesLoading || listsLoading;
  const error = enquiriesError ?? listsError;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const now = useNow();

  const logout = useCallback(() => {
    setToken(null);
    navigate("/admin/login", { replace: true });
  }, [navigate, setToken]);

  const fetchEnquiries = useCallback(async () => {
    try {
      setEnquiries(await getEnquiries(token));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Refresh button: show the loading state, then fetch again
  const load = useCallback(() => {
    setLoading(true);
    fetchEnquiries();
    if (listsError) retryLists();
  }, [fetchEnquiries, listsError, retryLists]);

  useEffect(() => {
    // State is only set after the request resolves, so this is a real external sync
    // oxlint-disable-next-line react/set-state-in-effect
    fetchEnquiries();
  }, [fetchEnquiries]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Optimistic: update the row right away, roll back if the API refuses
  const changeStatus = useCallback(
    async (id: string, next: EnquiryStatus) => {
      const before = enquiries;
      setEnquiries((list) => list.map((e) => (e.id === id ? { ...e, status: next } : e)));
      try {
        const updated = await updateEnquiryStatus(token, id, next);
        setEnquiries((list) => list.map((e) => (e.id === id ? updated : e)));
        setToast(`${id} marked as ${next}`);
      } catch (err) {
        setEnquiries(before);
        if (err instanceof ApiError && err.status === 401) return logout();
        setToast((err as Error).message);
      }
    },
    [enquiries, token, logout],
  );

  const replaceEnquiry = useCallback((updated: Enquiry, message: string) => {
    setEnquiries((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    setToast(message);
  }, []);

  const showError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return logout();
      setToast((err as Error).message);
    },
    [logout],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries
      .filter((e) => status === "all" || e.status === status)
      .filter((e) => source === "all" || e.source === source)
      .filter(
        (e) =>
          !q ||
          [e.id, e.name, e.company, e.email, e.phone].some((v) => v.toLowerCase().includes(q)) ||
          e.products.some((p) => p.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [enquiries, query, status, source]);

  const stats = useMemo(() => {
    const by = (s: EnquiryStatus) => enquiries.filter((e) => e.status === s).length;
    const app = enquiries.filter((e) => e.source === "app").length;
    return {
      total: enquiries.length,
      new: by("New"),
      overdue: enquiries.filter((e) => e.status === "New" && replyWindow(e.respondBy, now).overdue).length,
      activeOrders: enquiries.filter((e) => e.order && e.order.stage !== "Delivered").length,
      converted: by("Converted"),
      rate: enquiries.length ? Math.round((by("Converted") / enquiries.length) * 100) : 0,
      app,
      website: enquiries.length - app,
    };
  }, [enquiries, now]);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-ink">
              <Gift size={17} className="text-lime" />
            </span>
            <span className="font-extrabold">Tribe Green</span>
            <span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-muted">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-card hover:text-ink sm:flex"
            >
              View site <ExternalLink size={14} />
            </Link>
            <Button variant="outline" size="md" icon={LogOut} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Enquiries</h1>
            <p className="mt-1 text-sm text-muted">From the website and the Android app, newest first.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md" icon={RefreshCw} onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button
              variant="dark"
              size="md"
              icon={Download}
              onClick={() => downloadCsv(filtered)}
              disabled={!filtered.length}
            >
              Download CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total enquiries" value={stats.total} />
          <Stat
            label="New, not contacted"
            value={stats.new}
            highlight
            hint={
              stats.overdue
                ? `${stats.overdue} past the ${REPLY_WITHIN_HOURS}-hour promise`
                : `Call back within ${REPLY_WITHIN_HOURS} hours`
            }
          />
          <Stat
            label="Converted"
            value={stats.converted}
            hint={`${stats.rate}% conversion · ${stats.activeOrders} active ${stats.activeOrders === 1 ? "order" : "orders"}`}
          />
          <Stat label="Website / App" value={`${stats.website} / ${stats.app}`} />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-card px-4 focus-within:ring-2 focus-within:ring-ink lg:max-w-sm">
            <Search size={17} className="text-muted" />
            <span className="sr-only">Search enquiries</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, email, ref…"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
          </label>
          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: "all", label: "All" }, ...lists.statuses.map((s) => ({ value: s, label: s }))]}
          />
          <Segmented
            label="Source"
            value={source}
            onChange={setSource}
            options={[
              { value: "all", label: "All sources" },
              { value: "website", label: "Website" },
              { value: "app", label: "App" },
            ]}
          />
        </div>

        {error ? (
          <div role="alert" className="rounded-[24px] bg-danger-soft p-6 text-sm text-danger">
            {error}{" "}
            <button type="button" onClick={load} className="font-semibold underline">
              Try again
            </button>
          </div>
        ) : loading && !enquiries.length ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] bg-card px-6 py-16 text-center">
            <p className="font-bold">No enquiries match</p>
            <p className="mt-1 text-sm text-muted">Try clearing the search or filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-[28px] bg-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-3 py-4 font-semibold">Gifts</th>
                    <th className="px-3 py-4 font-semibold">Units</th>
                    <th className="px-3 py-4 font-semibold">Source</th>
                    <th className="px-3 py-4 font-semibold">Received</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((e) => (
                    <Row key={e.id} enquiry={e} now={now} onOpen={setSelectedId} onStatus={changeStatus} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {filtered.map((e) => (
                <li key={e.id} className="rounded-[24px] bg-card p-4">
                  <button type="button" onClick={() => setSelectedId(e.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{e.name}</p>
                        <p className="truncate text-sm text-muted">{e.company}</p>
                      </div>
                      <SourceBadge source={e.source} />
                    </div>
                    <p className="mt-3 truncate text-sm">{e.products.map((p) => p.name).join(", ")}</p>
                    <p className="mt-1 text-xs text-muted">
                      {e.units} units · {formatDate(e.createdAt)}
                    </p>
                    <ReplyBadge enquiry={e} now={now} />
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusSelect id={e.id} value={e.status} onChange={changeStatus} />
                    <OrderHint enquiry={e} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-faint">
              Showing {filtered.length} of {enquiries.length}. CSV downloads the rows currently shown.
            </p>
          </>
        )}
      </main>

      <DetailDrawer
        enquiry={selected}
        token={token}
        now={now}
        onClose={() => setSelectedId(null)}
        onStatus={changeStatus}
        onSaved={replaceEnquiry}
        onError={showError}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const Row = memo(function Row({
  enquiry: e,
  now,
  onOpen,
  onStatus,
}: {
  enquiry: Enquiry;
  now: number;
  onOpen: (id: string) => void;
  onStatus: (id: string, s: EnquiryStatus) => void;
}) {
  return (
    <tr className="cursor-pointer transition hover:bg-canvas/60" onClick={() => onOpen(e.id)}>
      <td className="px-5 py-4">
        <p className="font-semibold">{e.name}</p>
        <p className="text-xs text-muted">
          {e.company} · <span className="tracking-wide">{e.id}</span>
        </p>
      </td>
      <td className="max-w-56 px-3 py-4">
        <p className="truncate">{e.products.map((p) => p.name).join(", ")}</p>
        <p className="text-xs text-muted">{occasionMeta(e.occasion).short}</p>
      </td>
      <td className="px-3 py-4 font-semibold tabular-nums">{e.units.toLocaleString("en-IN")}</td>
      <td className="px-3 py-4">
        <SourceBadge source={e.source} />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-muted">
        {formatDate(e.createdAt)}
        <br />
        <ReplyBadge enquiry={e} now={now} />
      </td>
      <td className="px-5 py-4" onClick={(ev) => ev.stopPropagation()}>
        <StatusSelect id={e.id} value={e.status} onChange={onStatus} />
        <div className="mt-1.5">
          <OrderHint enquiry={e} />
        </div>
      </td>
    </tr>
  );
});

function StatusSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: EnquiryStatus;
  onChange: (id: string, s: EnquiryStatus) => void;
}) {
  const statuses = useLists().lists.statuses;
  return (
    <select
      aria-label={`Status for ${id}`}
      value={value}
      onChange={(e) => onChange(id, e.target.value as EnquiryStatus)}
      className={`h-9 cursor-pointer rounded-full border-0 px-3 pr-8 text-xs font-semibold outline-none focus:ring-2 focus:ring-ink ${statusStyle(value)}`}
    >
      {statuses.map((s) => (
        <option key={s} value={s} className="bg-card text-ink">
          {s}
        </option>
      ))}
    </select>
  );
}

// The 2-hour call-back promise, for enquiries nobody has called yet
function ReplyBadge({ enquiry, now }: { enquiry: Enquiry; now: number }) {
  if (enquiry.status !== "New") return null;
  const { overdue, label } = replyWindow(enquiry.respondBy, now);
  return (
    <span
      className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        overdue ? "bg-danger-soft text-danger" : "bg-lime-soft text-lime-ink"
      }`}
    >
      <Clock size={11} /> {overdue ? `Overdue by ${label}` : `Call within ${label}`}
    </span>
  );
}

function OrderHint({ enquiry }: { enquiry: Enquiry }) {
  if (enquiry.order) {
    return (
      <span className="text-[11px] whitespace-nowrap text-muted">
        {enquiry.order.stage} · due {formatDay(enquiry.order.expectedDelivery)}
      </span>
    );
  }
  if (enquiry.status === "Converted") {
    return (
      <span className="text-[11px] font-semibold whitespace-nowrap text-danger">Finalise the order</span>
    );
  }
  return null;
}

function SourceBadge({ source }: { source: Enquiry["source"] }) {
  const app = source === "app";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        app ? "bg-ink text-lime" : "bg-soft text-ink-soft"
      }`}
    >
      {app ? <Smartphone size={12} /> : <Globe size={12} />}
      {app ? "App" : "Website"}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-[24px] p-5 ${highlight ? "bg-lime" : "bg-card"}`}>
      <p className={`text-xs font-medium ${highlight ? "text-ink-soft" : "text-muted"}`}>{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-card p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold transition ${
            value === o.value ? "bg-ink text-white" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type SaveHandlers = {
  token: string;
  onSaved: (enquiry: Enquiry, message: string) => void;
  onError: (err: unknown) => void;
};

function DetailDrawer({
  enquiry,
  now,
  onClose,
  onStatus,
  ...handlers
}: SaveHandlers & {
  enquiry: Enquiry | null;
  now: number;
  onClose: () => void;
  onStatus: (id: string, s: EnquiryStatus) => void;
}) {
  useEffect(() => {
    if (!enquiry) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enquiry, onClose]);

  return (
    <AnimatePresence>
      {enquiry ? (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Enquiry ${enquiry.id}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-canvas"
          >
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted">{enquiry.id}</p>
                <h2 className="mt-1 text-2xl font-extrabold">{enquiry.name}</h2>
                <p className="text-sm text-muted">{enquiry.company}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="grid size-10 place-items-center rounded-full bg-card hover:bg-soft"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 pb-8">
              <div className="flex items-center gap-2">
                <StatusSelect id={enquiry.id} value={enquiry.status} onChange={onStatus} />
                <SourceBadge source={enquiry.source} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ContactLink href={`tel:${enquiry.phone}`} icon={Phone} label="Call" />
                <ContactLink
                  href={`https://wa.me/91${enquiry.phone.slice(-10)}?text=${encodeURIComponent(
                    `Hi ${enquiry.name.split(" ")[0]}, this is Tribe Green about your enquiry ${enquiry.id}.`,
                  )}`}
                  icon={MessageCircle}
                  label="WhatsApp"
                />
                <ContactLink
                  href={`mailto:${enquiry.email}?subject=Your Tribe Green enquiry ${enquiry.id}`}
                  icon={Mail}
                  label="Email"
                />
              </div>

              <dl className="divide-y divide-line rounded-[24px] bg-card px-5 text-sm">
                <Detail label="Phone" value={enquiry.phone} />
                <Detail label="Email" value={enquiry.email} />
                <Detail label="Occasion" value={enquiry.occasion} />
                <Detail label="Units" value={enquiry.units.toLocaleString("en-IN")} />
                {enquiryEstimate(enquiry.products) ? (
                  <Detail label="Estimated total" value={formatINR(enquiryEstimate(enquiry.products))} />
                ) : null}
                <Detail
                  label="Budget per unit"
                  value={`${getBudgetBand(enquiry.budget)?.label ?? enquiry.budget} (from the gifts)`}
                />
                <Detail
                  label="Deliver to"
                  value={
                    enquiry.address ? (
                      <span className="block max-w-[220px]">
                        {enquiry.address.line}, {enquiry.address.city}, {enquiry.address.state}{" "}
                        {enquiry.address.pincode}
                      </span>
                    ) : (
                      <span className="text-faint">Not given (older enquiry)</span>
                    )
                  }
                />
                <Detail
                  label="Delivery by"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} /> {formatDate(enquiry.deliveryDate, false)}
                    </span>
                  }
                />
                <Detail label="Customisation" value={enquiry.customisations.join(", ") || "None"} />
                <Detail label="Received" value={formatDate(enquiry.createdAt)} />
                <Detail
                  label="Call back by"
                  value={
                    <span className="inline-flex flex-col items-end gap-0.5">
                      {formatTime(enquiry.respondBy)}
                      <ReplyBadge enquiry={enquiry} now={now} />
                    </span>
                  }
                />
              </dl>

              <div className="rounded-[24px] bg-card p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold">Gifts and specification</p>
                  <p className="text-xs text-muted">{enquiry.units.toLocaleString("en-IN")} units</p>
                </div>
                <ul className="space-y-2.5">
                  {enquiry.products.map((p) => (
                    <GiftSpec key={p.id} item={p} />
                  ))}
                </ul>
                {/* The app still picks customisation for the whole enquiry */}
                {enquiry.customisations.length && !enquiry.products.some((p) => p.customisations?.length) ? (
                  <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
                    For all gifts:{" "}
                    <span className="font-semibold text-ink">{enquiry.customisations.join(", ")}</span>
                  </p>
                ) : null}
              </div>

              {enquiry.message ? (
                <div className="rounded-[24px] bg-card p-5">
                  <p className="mb-2 text-sm font-semibold">Message</p>
                  <p className="text-sm leading-6 whitespace-pre-line text-ink-soft">{enquiry.message}</p>
                </div>
              ) : null}

              {enquiry.status === "Lost" ? (
                <ClosedCard enquiry={enquiry} {...handlers} />
              ) : enquiry.order ? (
                <ManageOrder key={enquiry.id} enquiry={enquiry} {...handlers} />
              ) : (
                <FinaliseOrder key={enquiry.id} enquiry={enquiry} {...handlers} />
              )}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function ContactLink({ href, icon: Icon, label }: { href: string; icon: typeof Phone; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex flex-col items-center gap-1.5 rounded-[20px] bg-card py-3 text-xs font-semibold transition hover:bg-lime"
    >
      <Icon size={18} /> {label}
    </a>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

// One gift with everything the team needs to make it: units, size / colour split, customisation
function GiftSpec({ item }: { item: EnquiryItem & { unitPrice?: number } }) {
  return (
    <li className="rounded-2xl bg-canvas p-3">
      <div className="flex items-baseline justify-between gap-3">
        <Link
          to={`/product/${item.id}`}
          target="_blank"
          className="min-w-0 truncate text-sm font-semibold underline-offset-4 hover:underline"
        >
          {item.name}
        </Link>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {item.units} units
          {item.unitPrice || item.listPrice ? (
            <span className="font-normal text-muted">
              {" "}
              × {formatINR(item.unitPrice ?? item.listPrice ?? 0)}
              {item.unitPrice ? "" : " list"}
            </span>
          ) : null}
        </span>
      </div>
      {item.variants?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.variants.map((v) => (
            <span
              key={v.label}
              className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            >
              {COLOUR_SWATCH[v.label] ? (
                <span
                  className="size-2.5 rounded-full ring-1 ring-ink/15"
                  style={{ background: COLOUR_SWATCH[v.label] }}
                />
              ) : null}
              {v.label} · {v.units}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1">
        {item.customisations?.length ? (
          item.customisations.map((c) => {
            const { icon: Icon } = customisationMeta(c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-lime-soft px-2 py-0.5 text-[11px] font-semibold text-lime-ink"
              >
                <Icon size={11} /> {c}
              </span>
            );
          })
        ) : (
          <span className="text-[11px] text-faint">No customisation</span>
        )}
      </div>
    </li>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

const fieldCls =
  "h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none transition focus:border-ink focus:bg-card";

const orderTotal = (items: OrderItem[]) => items.reduce((sum, i) => sum + i.units * i.unitPrice, 0);

// Quote agreed: set the price per unit and the delivery date, and it becomes the customer's order.
// Not agreed: the enquiry moves to Lost.
function FinaliseOrder({ enquiry, token, onSaved, onError }: SaveHandlers & { enquiry: Enquiry }) {
  const { byId } = useProducts();
  const [prices, setPrices] = useState<Record<string, string> | null>(null);
  const [eta, setEta] = useState(enquiry.deliveryDate);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [askLost, setAskLost] = useState(false);

  // Start from each gift's catalogue price with its customisation; the admin can change it
  const start = () =>
    setPrices(
      Object.fromEntries(
        enquiry.products.map((p) => {
          const product = byId.get(p.id);
          const list = p.listPrice ?? (product ? unitPrice(product, p.customisations) : undefined);
          return [p.id, list ? String(list) : ""];
        }),
      ),
    );

  const markLost = async () => {
    setSaving(true);
    try {
      const updated = await updateEnquiryStatus(token, enquiry.id, "Lost", "Quote not agreed");
      setAskLost(false);
      onSaved(updated, `${enquiry.id} moved to Lost: quote not agreed`);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!prices) {
    return (
      <div className="rounded-[24px] bg-card p-5">
        <p className="font-bold">Did the customer agree to the quote?</p>
        <p className="mt-1 text-sm text-muted">
          Agreed: add the final prices and a delivery date, and it becomes their order. Not agreed: it moves
          to Lost.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="md" icon={ThumbsDown} onClick={() => setAskLost(true)}>
            Not agreed
          </Button>
          <Button variant="dark" size="md" icon={PackageCheck} onClick={start}>
            Finalise order
          </Button>
        </div>
        <ConfirmDialog
          open={askLost}
          title="Quote not agreed?"
          body={`${enquiry.id} moves to Lost and the customer sees it as cancelled. You can reopen it later.`}
          confirmLabel="Move to Lost"
          cancelLabel="Go back"
          loading={saving}
          onConfirm={markLost}
          onCancel={() => setAskLost(false)}
        />
      </div>
    );
  }

  const items: OrderItem[] = enquiry.products.map((p) => ({ ...p, unitPrice: Number(prices[p.id]) || 0 }));
  const valid = items.every((i) => i.unitPrice > 0) && eta >= today();

  const confirm = async () => {
    setSaving(true);
    try {
      const updated = await finaliseOrder(token, enquiry.id, {
        items,
        expectedDelivery: eta,
        note: note.trim(),
      });
      onSaved(updated, `${enquiry.id} confirmed · tracking ${updated.order?.trackingNumber ?? ""}`);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-card p-5">
      <p className="font-bold">Finalise order</p>
      <p className="mt-0.5 mb-4 text-xs text-muted">Final price per unit, including customisation</p>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-muted">
                {i.variants?.length ? `${describeVariants(i.variants)} · ` : ""}
                {i.units} units
                {i.customisations?.length
                  ? ` · ${i.customisations.map((c) => customisationMeta(c).short).join(", ")}`
                  : ""}
              </p>
            </div>
            <label className="flex h-10 w-28 shrink-0 items-center gap-1 rounded-xl border border-line bg-canvas px-3 focus-within:border-ink">
              <span className="text-sm text-muted">₹</span>
              <input
                inputMode="numeric"
                aria-label={`Price per unit for ${i.name}`}
                value={prices[i.id]}
                onChange={(e) => setPrices({ ...prices, [i.id]: e.target.value.replace(/\D/g, "") })}
                className="w-full min-w-0 bg-transparent text-sm font-semibold tabular-nums outline-none"
              />
            </label>
          </li>
        ))}
      </ul>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-semibold">Delivery date</span>
        <input
          type="date"
          min={today()}
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className={fieldCls}
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold">
          Note for the customer <span className="font-normal text-faint">(optional)</span>
        </span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mock-ups approved, production starts Monday."
          className={`${fieldCls} h-auto resize-none py-2.5`}
        />
        <span className="mt-1.5 block text-xs text-muted">
          A tracking number is created when you confirm, and the customer sees it straight away.
        </span>
      </label>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">Order total</span>
        <span className="text-lg font-extrabold tabular-nums">{formatINR(orderTotal(items))}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="md" onClick={() => setPrices(null)}>
          Cancel
        </Button>
        <Button
          variant="dark"
          size="md"
          icon={PackageCheck}
          className="flex-1"
          loading={saving}
          disabled={!valid}
          onClick={confirm}
        >
          Confirm order
        </Button>
      </div>
    </div>
  );
}

// Lost: why and when, with a way back
function ClosedCard({ enquiry, token, onSaved, onError }: SaveHandlers & { enquiry: Enquiry }) {
  const [saving, setSaving] = useState(false);
  const reopen = async () => {
    setSaving(true);
    try {
      onSaved(await updateEnquiryStatus(token, enquiry.id, "Contacted"), `${enquiry.id} reopened`);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="rounded-[24px] bg-danger-soft p-5">
      <p className="font-bold text-danger">Lost · {enquiry.closedReason ?? "Closed"}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {enquiry.closedAt ? `Closed ${formatDate(enquiry.closedAt)}. ` : ""}The customer sees this as
        cancelled.
      </p>
      <Button variant="outline" size="md" icon={RotateCcw} className="mt-4" loading={saving} onClick={reopen}>
        Reopen enquiry
      </Button>
    </div>
  );
}

// After confirmation: one stage at a time, forwards or back, with the date and note
function ManageOrder({ enquiry, token, onSaved, onError }: SaveHandlers & { enquiry: Enquiry }) {
  const order = enquiry.order!;
  const [eta, setEta] = useState(order.expectedDelivery);
  const [note, setNote] = useState(order.note);
  const [saving, setSaving] = useState<"back" | "forward" | "save" | null>(null);
  const [copied, setCopied] = useState(false);
  const dirty = eta !== order.expectedDelivery || note.trim() !== order.note;
  const stages = useLists().lists.orderStages;
  const index = stages.indexOf(order.stage);
  const prev = nextStage(stages, order.stage, -1);
  const next = nextStage(stages, order.stage, 1);

  // Every save carries the date and note, so nothing typed is lost when moving a stage
  const save = async (stage: OrderStage | undefined, kind: "back" | "forward" | "save") => {
    setSaving(kind);
    try {
      const updated = await updateOrder(token, enquiry.id, {
        ...(stage ? { stage } : {}),
        expectedDelivery: eta,
        note: note.trim(),
      });
      onSaved(updated, stage ? `${enquiry.id} moved to ${stage}` : `${enquiry.id} updated for the customer`);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(null);
    }
  };

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the number is on screen
    }
  };

  return (
    <div className="rounded-[24px] bg-card p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-bold">Order</p>
        <p className="text-lg font-extrabold tabular-nums">{formatINR(order.total)}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted">Confirmed {formatDate(order.confirmedAt)}</p>

      {/* Stage: ‹ Confirmed · In production · Dispatched · Delivered › */}
      <div className="mt-4 flex items-center gap-2">
        <StepButton
          label={prev ? `Back to ${prev}` : "Already at the first stage"}
          disabled={!prev || !!saving}
          loading={saving === "back"}
          onClick={() => prev && save(prev, "back")}
        >
          <ChevronLeft size={18} />
        </StepButton>
        <ol
          aria-label="Order stage"
          className="grid flex-1 gap-1"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        >
          {stages.map((st, i) => (
            <li key={st} aria-current={i === index ? "step" : undefined} className="min-w-0">
              <span className={`block h-1.5 rounded-full ${i <= index ? "bg-lime-deep" : "bg-soft"}`} />
              <span
                className={`mt-1.5 block text-[10px] leading-tight font-semibold ${
                  i === index ? "text-ink" : i < index ? "text-muted" : "text-faint"
                }`}
              >
                {st}
              </span>
            </li>
          ))}
        </ol>
        <StepButton
          label={next ? `Forward to ${next}` : "Order delivered"}
          disabled={!next || !!saving}
          loading={saving === "forward"}
          onClick={() => next && save(next, "forward")}
        >
          <ChevronRight size={18} />
        </StepButton>
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-semibold">Delivery date</span>
        <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={fieldCls} />
      </label>

      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-semibold">
          Note for the customer <span className="font-normal text-faint">(courier, tracking number)</span>
        </span>
        <div className="overflow-hidden rounded-xl border border-line bg-canvas focus-within:border-ink focus-within:bg-card">
          {order.trackingNumber ? (
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <span className="text-xs text-muted">
                Tracking no. <span className="font-bold tracking-wide text-ink">{order.trackingNumber}</span>
                <span className="ml-1.5 text-faint">· shown to the customer</span>
              </span>
              <button
                type="button"
                onClick={copyTracking}
                aria-label="Copy tracking number"
                className="grid size-7 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
              >
                {copied ? <PackageCheck size={14} /> : <Copy size={14} />}
              </button>
            </div>
          ) : null}
          <textarea
            rows={2}
            aria-label="Note for the customer"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shipped with BlueDart, arriving in 3 days."
            className="block w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {order.items.map((i) => (
          <GiftSpec key={i.id} item={i} />
        ))}
      </ul>

      {next ? (
        <Button
          variant="dark"
          size="md"
          iconRight={ChevronRight}
          className="mt-4 w-full"
          loading={saving === "forward"}
          disabled={!!saving}
          onClick={() => save(next, "forward")}
        >
          Save and move to {next}
        </Button>
      ) : (
        <p className="mt-4 rounded-full bg-lime-soft py-3 text-center text-sm font-semibold text-lime-ink">
          Delivered {order.stageTimes?.Delivered ? formatDate(order.stageTimes.Delivered) : ""}
        </p>
      )}
      {dirty ? (
        <button
          type="button"
          disabled={!!saving || !eta}
          onClick={() => save(undefined, "save")}
          className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-soft disabled:opacity-50"
        >
          {saving === "save" ? "Saving…" : `Save note and date only, stay at ${order.stage}`}
        </button>
      ) : null}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  loading,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-card transition hover:border-ink active:scale-95 disabled:opacity-35 disabled:hover:border-line"
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
