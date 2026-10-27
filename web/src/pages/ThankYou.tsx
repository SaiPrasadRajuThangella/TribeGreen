import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useParams } from "react-router";

import { ButtonLink } from "@/components/ui";
import { getBudgetBand, OCCASION_META } from "@/data/catalog";
import { useSeo } from "@/hooks/useSeo";
import { whatsappUrl } from "@/lib/whatsapp";
import type { Enquiry } from "@/types";

export default function ThankYou() {
  const { id } = useParams();
  const enquiry = (useLocation().state as { enquiry?: Enquiry } | null)?.enquiry;

  useSeo({
    title: "Enquiry sent",
    description:
      "Thank you for your enquiry. The Tribe Green gifting team will get back to you within 48 hours.",
    noindex: true,
  });

  return (
    <div className="container-page flex flex-col items-center py-16 text-center">
      <div className="relative mb-8 grid size-36 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-lime-soft"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 120, delay: 0.1 }}
        />
        <motion.span
          className="relative grid size-24 place-items-center rounded-full bg-lime"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 11, stiffness: 180 }}
        >
          <Check size={44} strokeWidth={2.6} />
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="max-w-md"
      >
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Enquiry sent!</h1>
        <p className="mt-3 text-muted">
          Thank you{enquiry ? `, ${enquiry.name.split(" ")[0]}` : ""}. Our gifting team will call you with a
          tailored quote within 48 hours.
        </p>
      </motion.div>

      {enquiry ? (
        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 w-full max-w-md rounded-[28px] bg-card p-6 text-left text-sm"
        >
          <Row label="Reference" value={enquiry.id} strong />
          <Row label="Gifts" value={enquiry.products.map((p) => p.name).join(", ")} />
          <Row label="Units" value={enquiry.units.toLocaleString("en-IN")} />
          <Row label="Occasion" value={OCCASION_META[enquiry.occasion].short} />
          <Row label="Budget" value={`${getBudgetBand(enquiry.budget)?.label} / unit`} />
        </motion.dl>
      ) : id ? (
        <p className="mt-6 text-sm text-muted">
          Reference <span className="font-bold text-ink">{id}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={whatsappUrl(`Hi Tribe Green! I just sent enquiry ${id ?? ""} from your website.`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-14 items-center gap-2 rounded-full border border-line bg-card px-7 text-[15px] font-semibold transition hover:border-ink"
        >
          <MessageCircle size={18} className="text-whatsapp" /> Chat on WhatsApp
        </a>
        <ButtonLink to="/catalogue" variant="dark" iconRight={ArrowRight}>
          Keep browsing
        </ButtonLink>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-6 border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right ${strong ? "font-bold tracking-wider" : "font-semibold"}`}>{value}</dd>
    </div>
  );
}
