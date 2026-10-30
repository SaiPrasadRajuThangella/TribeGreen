import { AlertCircle, Plus, Send, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { GiftRow } from "@/components/GiftRow";
import { Button, Chip } from "@/components/ui";
import { formatINR, OCCASION_META } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { createEnquiry } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { allCustomisations, lineTotal, quantityProblem, toEnquiryItem } from "@/lib/items";
import {
  formatPhone,
  type EnquiryFormErrors,
  type EnquiryFormValues,
  validateEnquiry,
} from "@/lib/validation";
import {
  type EnquiryDraft,
  isSignedIn,
  useCustomer,
  useEnquiryDraft,
  useEnquiryList,
  useMyOrders,
} from "@/store";
import { OCCASIONS } from "@/types";

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function EnquiryPage() {
  useSeo({
    title: "Request a quote",
    description: `Tell us about your corporate gifting needs: occasion, gifts, quantity and delivery date. Our team calls you back within ${REPLY_WITHIN_HOURS} hours.`,
    path: "/enquiry",
  });

  const navigate = useNavigate();
  const { byId } = useProducts();
  const listItems = useEnquiryList((s) => s.items);
  const clearList = useEnquiryList((s) => s.clear);
  const setListOpen = useEnquiryList((s) => s.setOpen);
  // Saved as the visitor types, so details survive a trip to the catalogue
  const draft = useEnquiryDraft((s) => s.draft);
  const setField = useEnquiryDraft((s) => s.setField);
  const clearDraft = useEnquiryDraft((s) => s.clear);
  const customer = useCustomer((s) => s.user);
  const signedIn = useCustomer(isSignedIn);

  const [errors, setErrors] = useState<EnquiryFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Gifts come straight from the enquiry list
  const gifts = useMemo(
    () =>
      listItems.flatMap((item) =>
        byId.get(item.productId) ? [{ item, product: byId.get(item.productId)! }] : [],
      ),
    [listItems, byId],
  );
  const totals = useMemo(
    () =>
      gifts.reduce(
        (acc, { item, product }) => ({
          units: acc.units + item.units,
          total: acc.total + lineTotal(product, item),
        }),
        { units: 0, total: 0 },
      ),
    [gifts],
  );

  const products = gifts.map(({ item, product }) => toEnquiryItem(product, item));
  // Signed-in customers start from their profile; anything typed here wins
  const form: EnquiryFormValues = {
    name: customer?.name ?? "",
    company: customer?.company ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    deliveryDate: "",
    message: "",
    ...draft,
    occasion: draft.occasion as EnquiryFormValues["occasion"],
    units: totals.units,
    products,
    // Chosen per gift; the enquiry also keeps the combined list (the app and CSV use it)
    customisations: allCustomisations(products),
  };

  const set = <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) => {
    setField(key, value);
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const { data, errors: found } = validateEnquiry(form);
    // Sizes are checked here too: the schema can't know which gifts come in sizes
    if (gifts.some(({ item, product }) => quantityProblem(product, item))) {
      found.products = "Finish the quantities for the marked gifts";
    }
    if (!data || found.products) {
      setErrors(found);
      // Move focus to the first field that needs attention
      const first = Object.keys(found)[0];
      document.getElementById(`field-${first}`)?.focus();
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Enquiries belong to an account: sign in, then come back here (the form is saved)
    if (!signedIn) {
      navigate("/login?next=/enquiry");
      return;
    }
    setSubmitting(true);
    try {
      const enquiry = await createEnquiry(data);
      // My orders loads fresh next time it opens
      useMyOrders.getState().reset();
      clearList();
      clearDraft();
      navigate(`/thank-you/${enquiry.id}`, { state: { enquiry } });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="container-page pt-6 pb-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Request a quote</h1>
        <p className="mt-2 text-muted">
          Tell us what you need. Our gifting team calls you back within {REPLY_WITHIN_HOURS} hours.
        </p>
        {signedIn && customer ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm text-muted">
            <UserRound size={15} /> Signed in as{" "}
            <span className="font-semibold text-ink">{customer.name}</span> · {formatPhone(customer.phone)}
          </p>
        ) : null}
      </div>

      <form
        noValidate
        onSubmit={submit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start"
      >
        <div className="space-y-5">
          {errorCount > 0 ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
            >
              <AlertCircle size={17} />
              {errorCount === 1 ? "1 field needs your attention" : `${errorCount} fields need your attention`}
            </div>
          ) : null}

          <Card title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" error={errors.name}>
                <input
                  id="field-name"
                  autoComplete="name"
                  placeholder="Ananya Sharma"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls(errors.name)}
                />
              </Field>
              <Field label="Company" name="company" error={errors.company}>
                <input
                  id="field-company"
                  autoComplete="organization"
                  placeholder="Acme Technologies"
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  className={inputCls(errors.company)}
                />
              </Field>
              <Field label="Mobile number" name="phone" error={errors.phone}>
                <input
                  id="field-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={14}
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls(errors.phone)}
                />
              </Field>
              <Field label="Work email" name="email" error={errors.email}>
                <input
                  id="field-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ananya@acme.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls(errors.email)}
                />
              </Field>
            </div>
          </Card>

          <Card title="Order details">
            <Field label="Occasion" name="occasion" error={errors.occasion} as="fieldset">
              <div id="field-occasion" tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
                {OCCASIONS.map((o) => (
                  <Chip
                    key={o}
                    icon={OCCASION_META[o].icon}
                    selected={form.occasion === o}
                    onClick={() => set("occasion", o)}
                  >
                    {OCCASION_META[o].short}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Number of units" name="units" error={errors.units} hint="Total of your gifts">
                <input
                  id="field-units"
                  readOnly
                  aria-describedby="hint-units"
                  value={totals.units ? totals.units.toLocaleString("en-IN") : "Add gifts to see the total"}
                  className={`${inputCls(errors.units)} cursor-default bg-soft/60 font-semibold focus:bg-soft/60`}
                />
              </Field>
              <Field label="Delivery date" name="deliveryDate" error={errors.deliveryDate}>
                <input
                  id="field-deliveryDate"
                  type="date"
                  min={tomorrow()}
                  value={form.deliveryDate}
                  onChange={(e) => set("deliveryDate", e.target.value)}
                  className={inputCls(errors.deliveryDate)}
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Message" name="message" error={errors.message} optional>
                <textarea
                  id="field-message"
                  rows={4}
                  maxLength={500}
                  placeholder="Packaging preferences, delivery cities, branding notes…"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  className={`${inputCls(errors.message)} h-auto resize-none py-3`}
                />
              </Field>
            </div>
            <p className="mt-3 text-xs text-faint">
              Logo printing, engraving and names are picked on each gift in your list.
            </p>
          </Card>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24">
          <div
            id="field-products"
            tabIndex={-1}
            className={`rounded-[28px] bg-card p-5 outline-none sm:p-6 ${errors.products ? "ring-2 ring-danger" : ""}`}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Gifts in this enquiry</h2>
              {gifts.length ? (
                <span className="text-sm text-muted">
                  {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
                </span>
              ) : null}
            </div>
            {gifts.length ? (
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {gifts.map(({ item, product }) => (
                    <motion.li key={product.id} layout exit={{ opacity: 0, x: 30 }}>
                      <GiftRow item={item} product={product} surface="canvas" />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
                No gifts added yet. Pick a few from the catalogue; what you've typed here stays saved.
              </p>
            )}
            {errors.products ? <p className="mt-2 text-sm text-danger">{errors.products}</p> : null}

            <Link
              to="/catalogue"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-faint text-sm font-semibold text-ink-soft transition hover:border-ink"
              onClick={() => setListOpen(false)}
            >
              <Plus size={16} /> {gifts.length ? "Add more gifts" : "Browse gifts"}
            </Link>

            {gifts.length ? (
              <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total units</span>
                  <span className="font-semibold tabular-nums">{totals.units.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Estimated total</span>
                  <span className="font-semibold tabular-nums">{formatINR(totals.total)}</span>
                </div>
                <p className="text-xs text-faint">
                  At catalogue prices with your customisation. The quote confirms it.
                </p>
              </div>
            ) : null}

            {serverError ? (
              <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                {serverError}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="dark"
              icon={signedIn ? Send : UserRound}
              loading={submitting}
              className="mt-5 w-full"
            >
              {signedIn ? "Send enquiry" : "Sign in to send"}
            </Button>
            <p className="mt-3 text-center text-xs text-faint">
              {signedIn
                ? `No payment needed. We'll call you with a quote within ${REPLY_WITHIN_HOURS} hours.`
                : "Sign in with your mobile number. Everything you've typed stays here."}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

const inputCls = (error?: string) =>
  `h-12 w-full rounded-2xl border bg-canvas px-4 text-[15px] outline-none transition placeholder:text-faint focus:bg-card ${
    error ? "border-danger" : "border-line focus:border-ink"
  }`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] bg-card p-6 sm:p-7">
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  error,
  optional,
  hint,
  as = "div",
  children,
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  as?: "div" | "fieldset";
  children: React.ReactNode;
}) {
  const errorText = error ? (
    <p id={`error-${name}`} className="mt-1.5 text-[13px] text-danger">
      {error}
    </p>
  ) : null;

  // Chip groups are fieldsets: <legend> has to be the fieldset's first child
  if (as === "fieldset") {
    return (
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{label}</legend>
        {children}
        {errorText}
      </fieldset>
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-between">
        <label htmlFor={`field-${name}`} className="text-sm font-semibold">
          {label}
        </label>
        {optional ? <span className="text-xs text-faint">Optional</span> : null}
        {hint ? (
          <span id={`hint-${name}`} className="text-xs text-faint">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      {errorText}
    </div>
  );
}
