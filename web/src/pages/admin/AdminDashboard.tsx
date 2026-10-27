import {
  CalendarDays,
  Download,
  ExternalLink,
  Gift,
  Globe,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui";
import { getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useSeo } from "@/hooks/useSeo";
import { ApiError, getEnquiries, updateEnquiryStatus } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { useAuth } from "@/store";
import type { Enquiry, EnquiryStatus } from "@/types";

const STATUSES: EnquiryStatus[] = ["New", "Contacted", "Converted", "Lost"];

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  New: "bg-lime-soft text-lime-ink",
  Contacted: "bg-[#E2EBF4] text-[#1F4A73]",
  Converted: "bg-ink text-white",
  Lost: "bg-danger-soft text-danger",
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
  }, [fetchEnquiries]);

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
        await updateEnquiryStatus(token, id, next);
        setToast(`${id} marked as ${next}`);
      } catch (err) {
        setEnquiries(before);
        if (err instanceof ApiError && err.status === 401) return logout();
        setToast((err as Error).message);
      }
    },
    [enquiries, token, logout],
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
      converted: by("Converted"),
      rate: enquiries.length ? Math.round((by("Converted") / enquiries.length) * 100) : 0,
      app,
      website: enquiries.length - app,
    };
  }, [enquiries]);

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
          <Stat label="New, not contacted" value={stats.new} highlight />
          <Stat label="Converted" value={stats.converted} hint={`${stats.rate}% conversion`} />
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
            options={[{ value: "all", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
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
                    <Row key={e.id} enquiry={e} onOpen={setSelectedId} onStatus={changeStatus} />
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
                  </button>
                  <div className="mt-3">
                    <StatusSelect id={e.id} value={e.status} onChange={changeStatus} />
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

      <DetailDrawer enquiry={selected} onClose={() => setSelectedId(null)} onStatus={changeStatus} />

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
  onOpen,
  onStatus,
}: {
  enquiry: Enquiry;
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
        <p className="text-xs text-muted">{OCCASION_META[e.occasion].short}</p>
      </td>
      <td className="px-3 py-4 font-semibold tabular-nums">{e.units.toLocaleString("en-IN")}</td>
      <td className="px-3 py-4">
        <SourceBadge source={e.source} />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-muted">{formatDate(e.createdAt)}</td>
      <td className="px-5 py-4" onClick={(ev) => ev.stopPropagation()}>
        <StatusSelect id={e.id} value={e.status} onChange={onStatus} />
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
  return (
    <select
      aria-label={`Status for ${id}`}
      value={value}
      onChange={(e) => onChange(id, e.target.value as EnquiryStatus)}
      className={`h-9 cursor-pointer rounded-full border-0 px-3 pr-8 text-xs font-semibold outline-none focus:ring-2 focus:ring-ink ${STATUS_STYLE[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-card text-ink">
          {s}
        </option>
      ))}
    </select>
  );
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

function DetailDrawer({
  enquiry,
  onClose,
  onStatus,
}: {
  enquiry: Enquiry | null;
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
                <Detail
                  label="Budget"
                  value={`${getBudgetBand(enquiry.budget)?.label ?? enquiry.budget} / unit`}
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
              </dl>

              <div className="rounded-[24px] bg-card p-5">
                <p className="mb-3 text-sm font-semibold">Gifts</p>
                <ul className="space-y-1.5 text-sm">
                  {enquiry.products.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/product/${p.id}`}
                        target="_blank"
                        className="underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {enquiry.message ? (
                <div className="rounded-[24px] bg-card p-5">
                  <p className="mb-2 text-sm font-semibold">Message</p>
                  <p className="text-sm leading-6 whitespace-pre-line text-ink-soft">{enquiry.message}</p>
                </div>
              ) : null}
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
