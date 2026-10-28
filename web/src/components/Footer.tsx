import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router";

import { CATEGORIES, OCCASIONS } from "@/types";
import { OCCASION_META } from "@/data/catalog";
import { GENERAL_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/whatsapp";

import { Logo } from "./Header";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Welcome kits, festive hampers and branded merchandise, customised with your logo and delivered
            across India.
          </p>
          <a
            href={whatsappUrl(GENERAL_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
          >
            <MessageCircle size={16} className="text-whatsapp" /> Chat on WhatsApp
          </a>
        </div>

        <FooterColumn title="Shop">
          {CATEGORIES.map((c) => (
            <FooterLink key={c} to={`/catalogue?category=${encodeURIComponent(c)}`}>
              {c}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Occasions">
          {OCCASIONS.map((o) => (
            <FooterLink key={o} to={`/catalogue?occasion=${encodeURIComponent(o)}`}>
              {OCCASION_META[o].short}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact">
          <li className="flex items-center gap-2 text-sm text-muted">
            <Mail size={15} /> hello@tribegreengifts.com
          </li>
          <li className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={15} /> Hyderabad, India
          </li>
          <FooterLink to="/enquiry">Request a quote</FooterLink>
          <FooterLink to="/orders">Track my order</FooterLink>
        </FooterColumn>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col justify-between gap-2 py-5 text-xs text-faint sm:flex-row">
          <p>© {YEAR} Tribe Green. A test project for V Green Media.</p>
          <p>
            Photos from{" "}
            <a
              href="https://unsplash.com"
              className="underline hover:text-muted"
              target="_blank"
              rel="noreferrer"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-muted transition hover:text-ink">
        {children}
      </Link>
    </li>
  );
}
