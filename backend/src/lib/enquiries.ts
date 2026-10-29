import type { z } from "zod";

import { config } from "../config.js";
import { CUSTOMISATIONS, type EnquiryStatus, MIN_ORDER, ORDER_STAGES } from "../domain.js";
import { Enquiry, type EnquiryDoc } from "../models/Enquiry.js";
import { Product } from "../models/Product.js";

import { badRequest, HttpError } from "./errors.js";
import { newEnquiryRef, newTrackingNumber } from "./ids.js";
import type { enquirySchema, ItemInput, orderChangesSchema, orderDraftSchema } from "./validation.js";

const HOUR = 3600000;

/*
 * Checks every gift against the catalogue: it exists, has enough units, the sizes / colours
 * are real and add up, and the customisation is one the gift offers.
 * Names come from the catalogue, not the client.
 */
export async function buildItems(input: ItemInput[]) {
  if (new Set(input.map((i) => i.id)).size !== input.length) {
    throw badRequest("Each gift can appear only once");
  }
  const products = await Product.find({ _id: { $in: input.map((i) => i.id) } }).lean();
  const byId = new Map(products.map((p) => [p._id, p]));
  const errors: Record<string, string> = {};

  const items = input.map((item, index) => {
    const key = `products.${index}`;
    const product = byId.get(item.id);
    if (!product) {
      errors[key] = `This gift is no longer in the catalogue: ${item.id}`;
      return null;
    }
    const fail = (message: string) => (errors[key] ??= message);
    const min = product.minOrder ?? MIN_ORDER;
    let variants: { label: string; units: number }[] | undefined;

    if (product.option) {
      const { name, values } = product.option;
      const kind = name.toLowerCase();
      if (!item.variants?.length) fail(`Pick ${kind}s and quantities for ${product.name}`);
      else {
        const unknown = item.variants.find((v) => !values.includes(v.label));
        const labels = item.variants.map((v) => v.label);
        const sum = item.variants.reduce((s, v) => s + v.units, 0);
        if (unknown) fail(`${product.name} doesn't come in ${unknown.label}`);
        else if (new Set(labels).size !== labels.length) fail(`Each ${kind} can appear only once`);
        else if (sum !== item.units) fail(`${product.name}: the ${kind}s add up to ${sum}, not ${item.units}`);
        // Kept in the catalogue's order (XS → XXL)
        variants = values.flatMap((label) => item.variants!.filter((v) => v.label === label));
      }
    } else if (item.variants?.length) {
      fail(`${product.name} doesn't come in sizes or colours`);
    }

    if (item.units < min) fail(`${product.name} needs at least ${min} units`);
    const notOffered = item.customisations.filter((c) => !product.customisations.includes(c));
    if (notOffered.length) fail(`${product.name} doesn't offer ${notOffered.join(", ").toLowerCase()}`);

    return {
      id: product._id,
      name: product.name,
      units: item.units,
      ...(variants ? { variants } : {}),
      customisations: CUSTOMISATIONS.filter((c) => item.customisations.includes(c)),
    };
  });

  const first = Object.values(errors)[0];
  if (first) throw badRequest(first, errors);
  return items.filter((i) => i !== null);
}

const isDuplicateRef = (err: unknown) =>
  (err as { code?: number; keyPattern?: Record<string, unknown> }).code === 11000 &&
  !!(err as { keyPattern?: Record<string, unknown> }).keyPattern?.ref;

// A new enquiry with a fresh reference and the call-back promise
export async function createEnquiry(input: z.output<typeof enquirySchema>, userId?: string) {
  const products = await buildItems(input.products);
  const createdAt = new Date();
  const fields = {
    ...input,
    products,
    user: userId,
    units: products.reduce((sum, p) => sum + p.units, 0),
    customisations: CUSTOMISATIONS.filter((c) => products.some((p) => p.customisations.includes(c))),
    respondBy: new Date(createdAt.getTime() + config.REPLY_WITHIN_HOURS * HOUR),
    createdAt,
  };
  // References are random; on the rare clash, draw another
  for (let attempt = 0; ; attempt++) {
    try {
      return await Enquiry.create({ ...fields, ref: newEnquiryRef() });
    } catch (err) {
      if (!isDuplicateRef(err) || attempt >= 4) throw err;
    }
  }
}

export async function findByRef(ref: string) {
  const enquiry = await Enquiry.findOne({ ref });
  if (!enquiry) throw new HttpError(404, "Enquiry not found");
  return enquiry;
}

export function applyStatus(enquiry: EnquiryDoc, status: EnquiryStatus, reason?: string) {
  const now = new Date();
  enquiry.status = status;
  if (status === "Contacted" && !enquiry.contactedAt) enquiry.contactedAt = now;
  if (status === "Lost") {
    enquiry.closedAt = now;
    enquiry.closedReason = reason || "Marked as lost";
  } else {
    enquiry.closedAt = undefined;
    enquiry.closedReason = undefined;
  }
}

// Quote agreed: prices from the admin, gifts and units from the enquiry, a new tracking number
export async function finaliseOrder(enquiry: EnquiryDoc, draft: z.output<typeof orderDraftSchema>) {
  if (enquiry.order) throw new HttpError(409, "This enquiry already has an order");
  if (enquiry.status === "Lost") throw new HttpError(409, "Reopen the enquiry before confirming an order");

  const prices = new Map(draft.items.map((i) => [i.id, i.unitPrice]));
  const items = enquiry.products.map((p) => {
    const unitPrice = prices.get(p.id);
    if (!unitPrice) throw badRequest(`Add a price for ${p.name}`);
    return { ...p.toObject(), unitPrice };
  });

  let trackingNumber = newTrackingNumber();
  while (await Enquiry.exists({ "order.trackingNumber": trackingNumber })) trackingNumber = newTrackingNumber();

  const now = new Date();
  enquiry.status = "Converted";
  enquiry.contactedAt ??= now;
  enquiry.closedAt = undefined;
  enquiry.closedReason = undefined;
  enquiry.set("order", {
    items,
    total: items.reduce((sum, i) => sum + i.units * i.unitPrice, 0),
    expectedDelivery: draft.expectedDelivery,
    stage: "Confirmed",
    stageTimes: { Confirmed: now },
    trackingNumber,
    note: draft.note,
    confirmedAt: now,
    updatedAt: now,
  });
}

// Orders move one stage at a time, forwards or back; moving back clears the later stage's time
export function changeOrder(enquiry: EnquiryDoc, changes: z.output<typeof orderChangesSchema>) {
  const order = enquiry.order;
  if (!order) throw badRequest("This enquiry has no order yet");
  if (enquiry.status === "Lost") throw new HttpError(409, "This order is cancelled");
  const now = new Date();

  if (changes.stage && changes.stage !== order.stage) {
    const from = ORDER_STAGES.indexOf(order.stage as (typeof ORDER_STAGES)[number]);
    const to = ORDER_STAGES.indexOf(changes.stage);
    if (Math.abs(to - from) !== 1) throw badRequest("Orders move one stage at a time");
    if (to > from) enquiry.set(`order.stageTimes.${changes.stage}`, now);
    else enquiry.set(`order.stageTimes.${order.stage}`, undefined);
    order.stage = changes.stage;
  }
  if (changes.expectedDelivery) order.expectedDelivery = changes.expectedDelivery;
  if (changes.note !== undefined) order.note = changes.note;
  order.updatedAt = now;
}
