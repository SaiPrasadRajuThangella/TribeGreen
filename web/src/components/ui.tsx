import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

const VARIANTS = {
  primary: "bg-lime text-ink hover:bg-lime-deep",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-line bg-card text-ink hover:border-ink",
  ghost: "bg-soft text-ink hover:bg-line",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
} as const;

const SIZES = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-[15px]",
} as const;

type Common = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children: ReactNode;
};

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 ease-spring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

function Inner({
  icon: Icon,
  iconRight: IconRight,
  children,
}: Pick<Common, "icon" | "iconRight" | "children">) {
  return (
    <>
      {Icon ? <Icon size={18} strokeWidth={2.2} aria-hidden /> : null}
      {children}
      {IconRight ? <IconRight size={18} strokeWidth={2.2} aria-hidden /> : null}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  className = "",
  children,
  loading,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="button"
      className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Spinner />
      ) : (
        <Inner icon={icon} iconRight={iconRight}>
          {children}
        </Inner>
      )}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  className = "",
  children,
  ...props
}: Common & LinkProps) {
  return (
    <Link className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      <Inner icon={icon} iconRight={iconRight}>
        {children}
      </Inner>
    </Link>
  );
}

export function Chip({
  selected = false,
  icon: Icon,
  children,
  className = "",
  ...props
}: { selected?: boolean; icon?: LucideIcon; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] whitespace-nowrap transition duration-200 ease-spring active:scale-[0.96] ${
        selected
          ? "bg-lime font-semibold text-ink"
          : "border border-line bg-card font-medium text-ink-soft hover:border-ink"
      } ${className}`}
      {...props}
    >
      {Icon ? <Icon size={15} strokeWidth={2} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// Blank page in the site colour, shown for a moment while a page's code downloads
export function PageLoading() {
  return <div className="min-h-dvh bg-canvas" />;
}
