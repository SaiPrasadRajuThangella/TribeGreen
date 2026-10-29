import { ArrowLeft, ArrowRight, Check, Gift, MessageSquareText, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui";
import { useNow } from "@/hooks/useNow";
import { useSeo } from "@/hooks/useSeo";
import { requestCode, updateProfile, verifyCode } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/validation";
import { isSignedIn, useCustomer, useEnquiryDraft } from "@/store";

type Step = "phone" | "code" | "profile";

const RESEND_AFTER_MS = 30000;

// Only same-site paths, so ?next= can't send people elsewhere
const safeNext = (next: string | null) => (next?.startsWith("/") && !next.startsWith("//") ? next : "/");

const BENEFITS = [
  "Send enquiries without typing your details again",
  `A call back within ${REPLY_WITHIN_HOURS} hours of every enquiry`,
  "Track each order, with its delivery date",
];

export default function Login() {
  useSeo({
    title: "Sign in",
    description: "Sign in with your mobile number to send enquiries and track your orders.",
    path: "/login",
    noindex: true,
  });

  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const signedIn = useCustomer(isSignedIn);
  const needsProfile = useCustomer((s) => !!s.token && !!s.user && !s.user.profileComplete);
  const setSession = useCustomer((s) => s.setSession);
  const setUser = useCustomer((s) => s.setUser);
  const draft = useEnquiryDraft((s) => s.draft);

  const [step, setStep] = useState<Step>(needsProfile ? "profile" : "phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  // Anything already typed on the quote form saves typing here
  const [profile, setProfile] = useState({
    name: draft.name ?? "",
    company: draft.company ?? "",
    email: draft.email ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const now = useNow(1000);

  // Signed in with a complete profile: carry on to where they were going
  if (signedIn) return <Navigate to={next} replace />;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidPhone(phone)) return setError("Enter a valid 10-digit mobile number");
    return run(async () => {
      const res = await requestCode(normalisePhone(phone));
      setDemoCode(res.demoCode ?? null);
      setCode("");
      setResendAt(Date.now() + RESEND_AFTER_MS);
      setStep("code");
    });
  };

  const verify = (value: string) =>
    run(async () => {
      try {
        const { token, user } = await verifyCode(normalisePhone(phone), value);
        setSession(token, user);
        // A new number has an account now; it only needs a name, company and email
        if (!user.profileComplete) {
          setProfile((p) => ({
            name: user.name || p.name,
            company: user.company || p.company,
            email: user.email || p.email,
          }));
          setStep("profile");
        }
      } catch (err) {
        setCode("");
        throw err;
      }
    });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim().length < 2) return setError("Enter your full name");
    if (profile.company.trim().length < 2) return setError("Enter your company name");
    if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) return setError("Enter a valid email address");
    return run(async () => setUser(await updateProfile(profile)));
  };

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  return (
    <div className="container-page grid min-h-[calc(100dvh-72px)] place-items-center py-8 sm:py-12">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[32px] bg-card shadow-[0_30px_80px_-50px_rgba(18,18,18,0.45)] lg:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
          <span className="absolute -top-24 -right-24 size-72 rounded-full bg-lime/10" aria-hidden />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-lime">
              <Gift size={22} className="text-ink" />
            </span>
            <h2 className="mt-8 text-3xl leading-tight font-extrabold tracking-tight">
              One account for every gift you send
            </h2>
            <ul className="mt-8 space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-white/80">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-white/50">
            Enquiries sent from the Tribe Green app with the same number show up here too.
          </p>
        </aside>

        <div className="p-6 sm:p-10">
          <Steps step={step} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === "phone" ? (
                <form onSubmit={sendCode} noValidate>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Sign in or create an account
                  </h1>
                  <p className="mt-2 text-muted">
                    Enter your mobile number and we'll send you a 6-digit code.
                  </p>
                  <label className="mt-8 block">
                    <span className="mb-2 block text-sm font-semibold">Mobile number</span>
                    <span
                      className={`flex h-14 items-center gap-3 rounded-2xl border bg-canvas px-4 transition focus-within:bg-card ${
                        error ? "border-danger" : "border-line focus-within:border-ink"
                      }`}
                    >
                      <span className="font-semibold text-muted">+91</span>
                      <span className="h-6 w-px bg-line" aria-hidden />
                      <input
                        autoFocus
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        maxLength={14}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError(null);
                        }}
                        className="h-full min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-faint"
                      />
                    </span>
                  </label>
                  <ErrorText error={error} />
                  <Button
                    type="submit"
                    variant="dark"
                    iconRight={ArrowRight}
                    loading={busy}
                    className="mt-6 w-full"
                  >
                    Send code
                  </Button>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-faint">
                    <ShieldCheck size={14} /> We use your number only for your enquiries and orders.
                  </p>
                </form>
              ) : step === "code" ? (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code.length === 6) verify(code);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setError(null);
                    }}
                    className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
                  >
                    <ArrowLeft size={15} /> Change number
                  </button>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Enter the code</h1>
                  <p className="mt-2 text-muted">
                    Sent to <span className="font-semibold text-ink">{formatPhone(phone)}</span>
                  </p>
                  <div className="mt-8">
                    <CodeInput
                      value={code}
                      disabled={busy}
                      invalid={!!error}
                      onChange={(value) => {
                        setCode(value);
                        setError(null);
                        if (value.length === 6) verify(value);
                      }}
                    />
                  </div>
                  {demoCode ? (
                    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-lime-soft px-4 py-3 text-sm text-lime-ink">
                      <MessageSquareText size={17} className="mt-0.5 shrink-0" />
                      <span>
                        Demo mode, no SMS is sent yet. Your code is{" "}
                        <span className="font-bold tracking-widest">{demoCode}</span>.
                      </span>
                    </p>
                  ) : null}
                  <ErrorText error={error} />
                  <Button
                    type="submit"
                    variant="dark"
                    loading={busy}
                    disabled={code.length < 6}
                    className="mt-6 w-full"
                  >
                    Verify and continue
                  </Button>
                  <p className="mt-4 text-center text-sm text-muted">
                    {resendIn ? (
                      <>Resend code in 0:{String(resendIn).padStart(2, "0")}</>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendCode()}
                        disabled={busy}
                        className="font-semibold text-ink underline-offset-4 hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </form>
              ) : (
                <form onSubmit={saveProfile} noValidate>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Welcome! Tell us about you
                  </h1>
                  <p className="mt-2 text-muted">
                    So every quote reaches the right person. You only do this once.
                  </p>
                  <div className="mt-8 space-y-4">
                    <ProfileField
                      label="Full name"
                      autoComplete="name"
                      placeholder="Ananya Sharma"
                      value={profile.name}
                      onChange={(name) => setProfile({ ...profile, name })}
                    />
                    <ProfileField
                      label="Company"
                      autoComplete="organization"
                      placeholder="Acme Technologies"
                      value={profile.company}
                      onChange={(company) => setProfile({ ...profile, company })}
                    />
                    <ProfileField
                      label="Work email"
                      type="email"
                      autoComplete="email"
                      placeholder="ananya@acme.com"
                      value={profile.email}
                      onChange={(email) => setProfile({ ...profile, email })}
                    />
                  </div>
                  <ErrorText error={error} />
                  <Button
                    type="submit"
                    variant="dark"
                    iconRight={ArrowRight}
                    loading={busy}
                    className="mt-6 w-full"
                  >
                    Continue
                  </Button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const index = { phone: 0, code: 1, profile: 2 }[step];
  return (
    <div className="mb-8 flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i <= index ? "w-8 bg-ink" : "w-4 bg-soft"}`}
        />
      ))}
    </div>
  );
}

// Six boxes over one real input, so paste and SMS autofill work
function CodeInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(true);
  return (
    <div className="relative">
      <input
        ref={ref}
        autoFocus
        aria-label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="absolute inset-0 z-10 w-full cursor-text opacity-0"
      />
      <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && i === Math.min(value.length, 5);
          return (
            <span
              key={i}
              className={`grid h-14 place-items-center rounded-2xl border text-xl font-bold tabular-nums transition sm:h-16 ${
                invalid
                  ? "border-danger bg-danger-soft/40"
                  : active
                    ? "border-ink bg-card ring-2 ring-ink/10"
                    : value[i]
                      ? "border-line bg-card"
                      : "border-line bg-canvas"
              }`}
            >
              {value[i] ?? (active ? <span className="h-6 w-0.5 animate-pulse bg-ink" /> : "")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  ...input
}: { label: string; value: string; onChange: (value: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-[15px] transition outline-none placeholder:text-faint focus:border-ink focus:bg-card"
      />
    </label>
  );
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mt-3 text-sm font-medium text-danger">
      {error}
    </p>
  ) : null;
}
