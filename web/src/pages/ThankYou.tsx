import { ArrowRight, Check, Clock, MessageCircle, PackageSearch } from "lucide-react";
import { motion } from "motion/react";
import { Link, useLocation, useParams } from "react-router";

import { CustomisationTags } from "@/components/orders";
import { ButtonLink } from "@/components/ui";
import { WhatsAppNotice } from "@/components/WhatsAppNotice";
import { formatINR, occasionMeta } from "@/data/catalog";
import { useSeo } from "@/hooks/useSeo";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { describeVariants, enquiryEstimate } from "@/lib/items";
import { formatTime } from "@/lib/time";
import { whatsappUrl } from "@/lib/whatsapp";
import type { Enquiry } from "@/types";

export default function ThankYou() {
  const { id } = useParams();
  const enquiry = (useLocation().state as { enquiry?: Enquiry } | null)?.enquiry;

  useSeo({
    title: "Enquiry sent",
    description: `Thank you for your enquiry. The Tribe Green gifting team will call you back within ${REPLY_WITHIN_HOURS} hours.`,
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
          Thank you{enquiry ? `, ${enquiry.name.split(" ")[0]}` : ""}. Our gifting team will message you on
          WhatsApp with a tailored quote within {REPLY_WITHIN_HOURS} hours.
        </p>
        {enquiry ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime-soft px-4 py-2 text-sm font-semibold text-lime-ink">
            <Clock size={16} /> Expect to hear from us by {formatTime(enquiry.respondBy)}
          </p>
        ) : null}
      </motion.div>

      {enquiry ? (
        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 w-full max-w-md rounded-[28px] bg-card p-6 text-left text-sm"
        >
          <Row label="Reference" value={enquiry.id} strong />
          <div className="border-t border-line py-3">
            <dt className="mb-2 text-muted">Gifts</dt>
            <dd className="space-y-2">
              {enquiry.products.map((p) => (
                <div key={p.id} className="flex justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.name}</span>
                    {p.variants?.length ? (
                      <span className="block text-xs text-muted">{describeVariants(p.variants)}</span>
                    ) : null}
                    <CustomisationTags item={p} />
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{p.units} units</span>
                </div>
              ))}
            </dd>
          </div>
          <Row label="Total units" value={enquiry.units.toLocaleString("en-IN")} />
          <Row label="Occasion" value={occasionMeta(enquiry.occasion).short} />
          {enquiry.address ? (
            <Row
              label="Deliver to"
              value={`${enquiry.address.line}, ${enquiry.address.city}, ${enquiry.address.state} ${enquiry.address.pincode}`}
            />
          ) : null}
          {enquiryEstimate(enquiry.products) ? (
            <Row label="Estimated total" value={formatINR(enquiryEstimate(enquiry.products))} />
          ) : null}
        </motion.dl>
      ) : id ? (
        <p className="mt-6 text-sm text-muted">
          Reference <span className="font-bold text-ink">{id}</span>
        </p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-6 w-full max-w-md"
      >
        <WhatsAppNotice sent />
      </motion.div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/orders" variant="dark" icon={PackageSearch}>
          Track in My orders
        </ButtonLink>
        <a
          href={whatsappUrl(`Hi Tribe Green! I just sent enquiry ${id ?? ""} from your website.`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-14 items-center gap-2 rounded-full border border-line bg-card px-7 text-[15px] font-semibold transition hover:border-ink"
        >
          <MessageCircle size={18} className="text-whatsapp" /> Chat on WhatsApp
        </a>
      </div>
      <Link
        to="/catalogue"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        Keep browsing <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-6 border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd
        className={`min-w-0 text-right break-words ${strong ? "font-bold tracking-wider" : "font-semibold"}`}
      >
        {value}
      </dd>
    </div>
  );
}
