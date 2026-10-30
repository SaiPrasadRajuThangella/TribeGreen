import type { Enquiry } from "@/types";

export type BadgeTone = "lime" | "ink" | "blue" | "soft" | "danger";

// Where an enquiry stands, in the customer's words
export function customerStatus(e: Enquiry): { label: string; tone: BadgeTone } {
  if (e.status === "Lost") return { label: "Cancelled", tone: "danger" };
  if (e.order?.stage === "Delivered") return { label: "Delivered", tone: "ink" };
  if (e.order) return { label: e.order.stage, tone: "lime" };
  if (e.status === "Converted") return { label: "Confirmed", tone: "lime" };
  if (e.status === "Contacted") return { label: "Quote shared", tone: "blue" };
  return { label: "Quote coming", tone: "soft" };
}
