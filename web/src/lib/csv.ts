import { getBudgetBand } from "@/data/catalog";
import type { Enquiry } from "@/types";

const COLUMNS: [string, (e: Enquiry) => string | number][] = [
  ["Reference", (e) => e.id],
  ["Created at", (e) => new Date(e.createdAt).toLocaleString("en-IN")],
  ["Source", (e) => e.source],
  ["Status", (e) => e.status],
  ["Name", (e) => e.name],
  ["Company", (e) => e.company],
  ["Phone", (e) => e.phone],
  ["Email", (e) => e.email],
  ["Occasion", (e) => e.occasion],
  ["Units", (e) => e.units],
  ["Budget per unit", (e) => getBudgetBand(e.budget)?.label ?? e.budget],
  ["Delivery date", (e) => e.deliveryDate],
  ["Products", (e) => e.products.map((p) => p.name).join("; ")],
  ["Customisation", (e) => e.customisations.join("; ")],
  ["Message", (e) => e.message],
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
