import {
  type Enquiry,
  type EnquiryInput,
  type EnquiryLookup,
  type EnquiryRef,
  type EnquiryStatus,
  nextStage,
  type OrderChanges,
  type OrderDraft,
  type OrderItem,
  type OrderStage,
} from "@/types";

import { ApiError } from "./apiError";
import { REPLY_WITHIN_HOURS } from "./config";
import { normalisePhone } from "./validation";

/*
 * Stand-in for the backend while it is being built.
 * Enquiries live in this browser's localStorage, seeded with a few samples
 * (from the app and the website) so the admin page has something to show.
 */

const KEY = "tg-mock-enquiries-v3";

// Demo-only admin login, used only in mock mode. The real backend checks its own credentials.
export const MOCK_ADMIN = { username: "admin", password: "tribegreen" };
export const MOCK_TOKEN = "mock-admin-token";

const HOUR = 3600000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 24 * HOUR).toISOString().slice(0, 10);
const replyBy = (createdAt: string) =>
  new Date(new Date(createdAt).getTime() + REPLY_WITHIN_HOURS * HOUR).toISOString();

// "TGT-261029-4821": date the order was confirmed plus four random digits
export const trackingNumber = (at = new Date()) =>
  `TGT-${at.toISOString().slice(2, 10).replace(/-/g, "")}-${String(Math.floor(1000 + Math.random() * 9000))}`;

function seed(e: Omit<Enquiry, "respondBy">): Enquiry {
  return { ...e, respondBy: replyBy(e.createdAt) };
}

const orderTotal = (items: OrderItem[]) => items.reduce((sum, i) => sum + i.units * i.unitPrice, 0);

const SEED: Enquiry[] = [
  seed({
    id: "TG-8K2QXA",
    source: "app",
    status: "New",
    createdAt: hoursAgo(0.6),
    name: "Priya Menon",
    company: "Northwind Analytics",
    phone: "9845012345",
    email: "priya@northwind.example",
    occasion: "Corporate Diwali Gifting",
    units: 150,
    budget: "500-1500",
    deliveryDate: inDays(18),
    products: [
      { id: "scented-candle", name: "Spiced Soy Candle", units: 100 },
      { id: "travel-tumbler", name: "Commuter Steel Tumbler", units: 50 },
    ],
    // Sent from the app, which still picks customisation for the whole enquiry
    customisations: ["Logo printing"],
    message: "Need individual gift boxes with a thank-you card.",
  }),
  seed({
    id: "TG-6PZ2NC",
    source: "website",
    status: "New",
    createdAt: hoursAgo(3),
    name: "Sameer Khan",
    company: "Lumen Fintech",
    phone: "9123456780",
    email: "sameer@lumen.example",
    occasion: "Employee Recognition",
    units: 110,
    budget: "1500-3000",
    deliveryDate: inDays(21),
    products: [
      {
        id: "premium-hoodie",
        name: "Essential Hoodie",
        units: 60,
        variants: [
          { label: "M", units: 20 },
          { label: "L", units: 25 },
          { label: "XL", units: 15 },
        ],
        customisations: ["Logo printing", "Name personalisation"],
      },
      {
        id: "baseball-cap",
        name: "Six-Panel Cap",
        units: 50,
        variants: [
          { label: "Black", units: 30 },
          { label: "Navy", units: 20 },
        ],
        customisations: ["Logo printing"],
      },
    ],
    customisations: ["Logo printing", "Name personalisation"],
    message: "Annual awards night. Names on the hoodies, please.",
  }),
  seed({
    id: "TG-7HD31M",
    source: "website",
    status: "Contacted",
    createdAt: hoursAgo(34),
    contactedAt: hoursAgo(33),
    name: "Rahul Verma",
    company: "Brightpath Learning",
    phone: "9811122233",
    email: "rahul.v@brightpath.example",
    occasion: "Employee Onboarding",
    units: 60,
    budget: "1500-3000",
    deliveryDate: inDays(25),
    products: [
      { id: "laptop-backpack", name: "Metro Laptop Backpack", units: 20, customisations: ["Logo printing"] },
      {
        id: "steel-bottle",
        name: "Aqua Steel Bottle",
        units: 20,
        variants: [
          { label: "Black", units: 10 },
          { label: "Sage", units: 10 },
        ],
        customisations: ["Laser engraving", "Name personalisation"],
      },
      {
        id: "leather-notebook",
        name: "Heritage Leather Diary",
        units: 20,
        customisations: ["Logo printing"],
      },
    ],
    customisations: ["Logo printing", "Laser engraving", "Name personalisation"],
    message: "Welcome kits for our new Bengaluru office.",
  }),
  (() => {
    const items: OrderItem[] = [
      {
        id: "tea-gift-box",
        name: "Himalayan Tea Collection",
        units: 40,
        customisations: ["Laser engraving"],
        unitPrice: 2890,
      },
    ];
    return seed({
      id: "TG-5RT9LP",
      source: "app",
      status: "Converted",
      createdAt: hoursAgo(96),
      contactedAt: hoursAgo(94),
      name: "Sneha Iyer",
      company: "Kestrel Foods",
      phone: "9900887766",
      email: "sneha@kestrel.example",
      occasion: "Client and Vendor Gifting",
      units: 40,
      budget: "above-3000",
      deliveryDate: inDays(9),
      products: [
        {
          id: "tea-gift-box",
          name: "Himalayan Tea Collection",
          units: 40,
          customisations: ["Laser engraving"],
        },
      ],
      customisations: ["Laser engraving"],
      message: "",
      order: {
        items,
        total: orderTotal(items),
        expectedDelivery: inDays(8),
        stage: "In production",
        stageTimes: { Confirmed: hoursAgo(72), "In production": hoursAgo(20) },
        trackingNumber: "TGT-261026-3307",
        note: "Engraving proofs approved. Boxes are being packed in Hyderabad.",
        confirmedAt: hoursAgo(72),
        updatedAt: hoursAgo(20),
      },
    });
  })(),
  seed({
    id: "TG-3MV8QE",
    source: "website",
    status: "Lost",
    createdAt: hoursAgo(168),
    contactedAt: hoursAgo(166),
    closedAt: hoursAgo(140),
    closedReason: "Quote not agreed",
    name: "Arjun Kapoor",
    company: "Helix Robotics",
    phone: "9876501234",
    email: "arjun@helix.example",
    occasion: "Events and Trade Shows",
    units: 500,
    budget: "under-500",
    deliveryDate: inDays(4),
    products: [
      {
        id: "baseball-cap",
        name: "Six-Panel Cap",
        units: 300,
        variants: [{ label: "Black", units: 300 }],
        customisations: ["Logo printing"],
      },
      {
        id: "polo-tshirt",
        name: "Pique Polo T-shirt",
        units: 200,
        variants: [
          { label: "S", units: 40 },
          { label: "M", units: 80 },
          { label: "L", units: 60 },
          { label: "XL", units: 20 },
        ],
        customisations: ["Logo printing"],
      },
    ],
    customisations: ["Logo printing"],
    message: "Booth giveaways for a 3-day expo.",
  }),
];

function read(): Enquiry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Enquiry[];
  } catch {
    // Storage blocked or corrupted: fall back to the seed data
  }
  return SEED;
}

function write(enquiries: Enquiry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(enquiries));
  } catch {
    // Ignore: mock data simply won't persist
  }
}

function update(id: string, change: (e: Enquiry) => Enquiry) {
  const found = read().find((e) => e.id === id);
  if (!found) throw new ApiError("Enquiry not found", 404);
  const changed = change(found);
  write(read().map((e) => (e.id === id ? changed : e)));
  return changed;
}

const last10 = (phone: string) => normalisePhone(phone).replace(/\D/g, "").slice(-10);
const samePhone = (a: string, b: string) => last10(a) === last10(b);

export const mockDb = {
  list: () => read(),
  create(input: EnquiryInput): Enquiry {
    const createdAt = new Date().toISOString();
    const enquiry: Enquiry = {
      ...input,
      id: `TG-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      source: "website",
      status: "New",
      createdAt,
      respondBy: replyBy(createdAt),
    };
    write([enquiry, ...read()]);
    return enquiry;
  },
  // Enquiries saved on this device: reference and phone must both match
  track: (refs: EnquiryRef[]) =>
    read().filter((e) => refs.some((r) => r.id === e.id && samePhone(r.phone, e.phone))),
  // The Track form: a reference finds one enquiry, a mobile number finds all of theirs
  find: (lookup: EnquiryLookup) =>
    read().filter((e) => ("id" in lookup ? e.id === lookup.id : samePhone(e.phone, lookup.phone))),
  changePhone: (ref: EnquiryRef, phone: string) => {
    const found = read().find((e) => e.id === ref.id && samePhone(e.phone, ref.phone));
    if (!found) throw new ApiError("Enquiry not found", 404);
    return update(ref.id, (e) => ({ ...e, phone: normalisePhone(phone) }));
  },
  setStatus: (id: string, status: EnquiryStatus, reason?: string) =>
    update(id, (e) => {
      const now = new Date().toISOString();
      return {
        ...e,
        status,
        contactedAt: e.contactedAt ?? (status === "Contacted" ? now : undefined),
        closedAt: status === "Lost" ? now : undefined,
        closedReason: status === "Lost" ? (reason ?? "Marked as lost") : undefined,
      };
    }),
  finalise: (id: string, draft: OrderDraft) => {
    const now = new Date();
    const at = now.toISOString();
    const stage: OrderStage = "Confirmed";
    return update(id, (e) => ({
      ...e,
      status: "Converted",
      contactedAt: e.contactedAt ?? at,
      closedAt: undefined,
      closedReason: undefined,
      order: {
        ...draft,
        total: orderTotal(draft.items),
        stage,
        stageTimes: { Confirmed: at },
        trackingNumber: trackingNumber(now),
        confirmedAt: at,
        updatedAt: at,
      },
    }));
  },
  updateOrder: (id: string, changes: OrderChanges) =>
    update(id, (e) => {
      if (!e.order) throw new ApiError("This enquiry has no order yet", 400);
      const now = new Date().toISOString();
      const order = { ...e.order, ...changes, updatedAt: now };
      if (changes.stage && changes.stage !== e.order.stage) {
        const forward = nextStage(e.order.stage, 1) === changes.stage;
        const back = nextStage(e.order.stage, -1) === changes.stage;
        if (!forward && !back) throw new ApiError("Orders move one stage at a time", 400);
        const stageTimes = { ...e.order.stageTimes };
        if (forward) stageTimes[changes.stage] = now;
        else delete stageTimes[e.order.stage];
        order.stageTimes = stageTimes;
      }
      return { ...e, order };
    }),
};
