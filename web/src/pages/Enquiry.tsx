import { AlertCircle, Plus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { Button, Chip } from "@/components/ui";
import { BUDGET_BANDS, formatINR, OCCASION_META } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { createEnquiry } from "@/lib/api";
import { type EnquiryFormErrors, type EnquiryFormValues, validateEnquiry } from "@/lib/validation";
import { useEnquiryList } from "@/store";
import { CUSTOMISATIONS, type Customisation, OCCASIONS } from "@/types";

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function EnquiryPage() {
  useSeo({
    title: "Request a quote",
    description:
      "Tell us about your corporate gifting needs: occasion, quantity, budget and delivery date. Our team replies within 48 hours.",
    path: "/enquiry",
  });

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { byId, loading } = useProducts();
  const listItems = useEnquiryList((s) => s.items);
  const removeFromList = useEnquiryList((s) => s.remove);
  const setListOpen = useEnquiryList((s) => s.setOpen);

  // Start from one product (?product=) or everything in the enquiry list
  const initial = useMemo<EnquiryFormValues>(() => {
    const productParam = params.get("product");
    const source = productParam
      ? [
          {
            productId: productParam,
            units: Number(params.get("units")) || byId.get(productParam)?.minOrder || 25,
          },
        ]
      : listItems;
    const products = source.flatMap((i) => {
      const p = byId.get(i.productId);
      return p ? [{ id: p.id, name: p.name }] : [];
    });
    const units = source.reduce((sum, i) => sum + i.units, 0);
    return {
      name: "",
      company: "",
      phone: "",
      email: "",
      occasion: undefined as unknown as EnquiryFormValues["occasion"],
      units: units ? String(units) : "",
      budget: undefined as unknown as EnquiryFormValues["budget"],
      deliveryDate: "",
      products,
      customisations: [],
      message: "",
    };
    // Recompute once products have loaded; afterwards the form owns the values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const [values, setValues] = useState<EnquiryFormValues | null>(null);
  const form = values ?? initial;
  const [errors, setErrors] = useState<EnquiryFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) => {
    setValues((v) => ({ ...(v ?? initial), [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const toggleCustomisation = (c: Customisation) => {
    const current = form.customisations ?? [];
    set("customisations", current.includes(c) ? current.filter((x) => x !== c) : [...current, c]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const { data, errors: found } = validateEnquiry(form);
    if (!data) {
      setErrors(found);
      // Move focus to the first field that needs attention
      const first = Object.keys(found)[0];
      document.getElementById(`field-${first}`)?.focus();
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const enquiry = await createEnquiry(data);
      data.products.forEach((p) => removeFromList(p.id));
      navigate(`/thank-you/${enquiry.id}`, { state: { enquiry } });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const estimate = form.products.reduce(
    (acc, p) => {
      const product = byId.get(p.id);
      return product ? { min: acc.min + product.priceMin, max: acc.max + product.priceMax } : acc;
    },
    { min: 0, max: 0 },
  );

  return (
    <div className="container-page pt-6 pb-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Request a quote</h1>
        <p className="mt-2 text-muted">Tell us what you need. Our gifting team replies within 48 hours.</p>
      </div>

      <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
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
              <Field label="Number of units" name="units" error={errors.units}>
                <input
                  id="field-units"
                  inputMode="numeric"
                  placeholder="100"
                  value={String(form.units ?? "")}
                  onChange={(e) => set("units", e.target.value.replace(/[^0-9]/g, ""))}
                  className={inputCls(errors.units)}
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
              <Field label="Budget per unit" name="budget" error={errors.budget} as="fieldset">
                <div id="field-budget" tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
                  {BUDGET_BANDS.map((b) => (
                    <Chip key={b.id} selected={form.budget === b.id} onClick={() => set("budget", b.id)}>
                      {b.label}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card title="Customisation">
            <div className="flex flex-wrap gap-2">
              {CUSTOMISATIONS.map((c) => (
                <Chip
                  key={c}
                  selected={form.customisations?.includes(c)}
                  onClick={() => toggleCustomisation(c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-xs text-faint">Pick all that apply, or none for plain gifts.</p>

            <div className="mt-6">
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
          </Card>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24">
          <div className={`rounded-[28px] bg-card p-6 ${errors.products ? "ring-2 ring-danger" : ""}`}>
            <h2 className="mb-4 text-lg font-bold">Gifts in this enquiry</h2>
            {form.products.length ? (
              <ul className="space-y-2.5">
                {form.products.map((p) => {
                  const product = byId.get(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-canvas p-2">
                      <img
                        src={product?.images[0]}
                        alt=""
                        className="size-12 rounded-xl bg-soft object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        {product ? (
                          <span className="text-xs text-muted">
                            from {formatINR(product.priceMin)} / unit
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() =>
                          set(
                            "products",
                            form.products.filter((x) => x.id !== p.id),
                          )
                        }
                        className="grid size-8 place-items-center rounded-full bg-card text-muted hover:text-danger"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">No gifts added yet.</p>
            )}
            {errors.products ? <p className="mt-2 text-sm text-danger">{errors.products}</p> : null}

            <Link
              to="/catalogue"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-faint text-sm font-semibold text-ink-soft transition hover:border-ink"
              onClick={() => setListOpen(false)}
            >
              <Plus size={16} /> Add more gifts
            </Link>

            {form.products.length ? (
              <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
                <span className="text-muted">Price range per unit</span>
                <span className="font-semibold">
                  {formatINR(estimate.min)} – {formatINR(estimate.max)}
                </span>
              </div>
            ) : null}

            {serverError ? (
              <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" variant="dark" icon={Send} loading={submitting} className="mt-5 w-full">
              Send enquiry
            </Button>
            <p className="mt-3 text-center text-xs text-faint">
              No payment needed. We'll call you with a quote.
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
  as = "div",
  children,
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
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
      </div>
      {children}
      {errorText}
    </div>
  );
}
