import { Gift, Menu, Package, Search, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

import { useEnquiryList } from "@/store";

import { ButtonLink } from "./ui";

const NAV = [
  { to: "/catalogue", label: "Catalogue" },
  { to: "/catalogue?occasion=Corporate+Diwali+Gifting", label: "Diwali gifting" },
  { to: "/catalogue?occasion=Employee+Onboarding", label: "Onboarding kits" },
  // Only on wide screens in the header bar; always in the menu
  { to: "/catalogue?occasion=Client+and+Vendor+Gifting", label: "Client gifts", wideOnly: true },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Tribe Green home">
      <span className="grid size-10 place-items-center rounded-2xl bg-ink">
        <Gift size={19} className="text-lime" strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold">Tribe Green</span>
        <span className="hidden text-[11px] text-muted sm:block">Corporate gifting studio</span>
      </span>
    </Link>
  );
}

export function Header() {
  const count = useEnquiryList((s) => s.items.length);
  const setOpen = useEnquiryList((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  // The menu belongs to the page it was opened on, so navigating closes it
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const menuOpen = menuKey === location.key;
  const setMenuOpen = (open: boolean) => setMenuKey(open ? location.key : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-line/70 bg-canvas/85 backdrop-blur-xl" : "bg-canvas"
      }`}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition hover:bg-card ${
                  isActive && item.to === "/catalogue" ? "bg-card" : ""
                } ${item.wideOnly ? "max-xl:hidden" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/catalogue?focus=1"
            aria-label="Search gifts"
            className="grid size-11 place-items-center rounded-full bg-card transition hover:bg-soft"
          >
            <Search size={19} />
          </Link>
          {/* Phones reach My orders from the menu, to keep the header from overflowing */}
          <Link
            to="/orders"
            aria-label="My orders"
            title="My orders"
            className="grid size-11 place-items-center rounded-full bg-card transition hover:bg-soft max-sm:hidden"
          >
            <Package size={19} />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open enquiry list, ${count} items`}
            className="relative grid size-11 place-items-center rounded-full bg-card transition hover:bg-soft"
          >
            <ShoppingBag size={19} />
            <AnimatePresence>
              {count > 0 ? (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-bold"
                >
                  {count}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
          <ButtonLink to="/enquiry" variant="dark" size="md" className="max-sm:hidden">
            Get a quote
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="grid size-11 place-items-center rounded-full bg-card lg:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-line bg-canvas lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 pb-5">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-2xl px-4 py-3 font-medium hover:bg-card"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/orders"
                className="flex items-center gap-2 rounded-2xl px-4 py-3 font-medium hover:bg-card"
              >
                <Package size={17} /> My orders
              </Link>
              <ButtonLink to="/enquiry" variant="dark" className="mt-2 sm:hidden">
                Get a quote
              </ButtonLink>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
