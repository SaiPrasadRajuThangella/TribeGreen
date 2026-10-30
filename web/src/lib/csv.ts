import { getBudgetBand } from "@/data/catalog";
import type { Enquiry, EnquiryItem } from "@/types";

import { describeVariants, enquiryEstimate } from "./items";

// "Essential Hoodie × 60 (M × 20 · L × 40) [Logo printing, Name personalisation]"
const giftCell = (p: EnquiryItem) =>
  `${p.name} × ${p.units}${p.variants?.length ? ` (${describeVariants(p.variants)})` : ""}${
    p.customisations?.length ? ` [${p.customisations.join(", ")}]` : ""
  }`;

const COLUMNS: [string, (e: Enquiry) => string | number][] = [
  ["Reference", (e) => e.id],
  ["Created at", (e) => new Date(e.createdAt).toLocaleString("en-IN")],
  ["Call back by", (e) => new Date(e.respondBy).toLocaleString("en-IN")],
  ["Source", (e) => e.source],
  ["Status", (e) => e.status],
  ["Name", (e) => e.name],
  ["Company", (e) => e.company],
  ["Phone", (e) => e.phone],
  ["Email", (e) => e.email],
  ["Occasion", (e) => e.occasion],
  ["Units", (e) => e.units],
  ["Estimated total", (e) => enquiryEstimate(e.products) || ""],
  ["Budget per unit", (e) => getBudgetBand(e.budget)?.label ?? e.budget],
  ["Delivery date", (e) => e.deliveryDate],
  // Older enquiries have no address
  ["Delivery address", (e) => e.address?.line ?? ""],
  ["City", (e) => e.address?.city ?? ""],
  ["State", (e) => e.address?.state ?? ""],
  ["PIN code", (e) => e.address?.pincode ?? ""],
  ["Products", (e) => e.products.map(giftCell).join("; ")],
  ["Customisation", (e) => e.customisations.join("; ")],
  ["Message", (e) => e.message],
  ["Lost reason", (e) => (e.status === "Lost" ? (e.closedReason ?? "") : "")],
  ["Order stage", (e) => e.order?.stage ?? ""],
  ["Tracking number", (e) => e.order?.trackingNumber ?? ""],
  ["Expected delivery", (e) => e.order?.expectedDelivery ?? ""],
  ["Order total", (e) => e.order?.total ?? ""],
];

// Quote every cell so commas, quotes and new lines survive Excel
const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function enquiriesToCsv(enquiries: Enquiry[]) {
  const header = COLUMNS.map(([name]) => cell(name)).join(",");
  const rows = enquiries.map((e) => COLUMNS.map(([, get]) => cell(get(e))).join(","));
  return [header, ...rows].join("\r\n");
}

export function downloadCsv(enquiries: Enquiry[]) {
  // BOM so Excel opens the ₹ symbol correctly
  const blob = new Blob(["﻿" + enquiriesToCsv(enquiries)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tribe-green-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
