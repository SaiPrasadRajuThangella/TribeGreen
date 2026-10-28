import type {
  Enquiry,
  EnquiryInput,
  EnquiryRef,
  EnquiryStatus,
  OrderChanges,
  OrderDraft,
  OrderItem,
  OrderStage,
} from "@/types";

import { REPLY_WITHIN_HOURS } from "./config";
import { normalisePhone } from "./validation";

/*
 * Stand-in for the backend while it is being built.
 * Enquiries live in this browser's localStorage, seeded with a few samples
 * (from the app and the website) so the admin page has something to show.
 */

const KEY = "tg-mock-enquiries-v2";

// Demo-only admin login, used only in mock mode. The real backend checks its own credentials.
export const MOCK_ADMIN = { username: "admin", password: "tribegreen" };
export const MOCK_TOKEN = "mock-admin-token";

const HOUR = 3600000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 24 * HOUR).toISOString().slice(0, 10);
const replyBy = (createdAt: string) =>
  new Date(new Date(createdAt).getTime() + REPLY_WITHIN_HOURS * HOUR).toISOString();

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
      },
      {
        id: "baseball-cap",
        name: "Six-Panel Cap",
        units: 50,
        variants: [
          { label: "Black", units: 30 },
          { label: "Navy", units: 20 },
        ],
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
    name: "Rahul Verma",
    company: "Brightpath Learning",
    phone: "9811122233",
    email: "rahul.v@brightpath.example",
    occasion: "Employee Onboarding",
    units: 60,
    budget: "1500-3000",
    deliveryDate: inDays(25),
    products: [
      { id: "laptop-backpack", name: "Metro Laptop Backpack", units: 20 },
      {
        id: "steel-bottle",
        name: "Aqua Steel Bottle",
        units: 20,
        variants: [
          { label: "Black", units: 10 },
          { label: "Sage", units: 10 },
        ],
      },
      { id: "leather-notebook", name: "Heritage Leather Diary", units: 20 },
    ],
    customisations: ["Logo printing", "Name personalisation"],
    message: "Welcome kits for our new Bengaluru office.",
  }),
  (() => {
    const items: OrderItem[] = [
      { id: "tea-gift-box", name: "Himalayan Tea Collection", units: 40, unitPrice: 2890 },
    ];
    return seed({
      id: "TG-5RT9LP",
      source: "app",
      status: "Converted",
      createdAt: hoursAgo(96),
      name: "Sneha Iyer",
      company: "Kestrel Foods",
      phone: "9900887766",
      email: "sneha@kestrel.example",
      occasion: "Client and Vendor Gifting",
      units: 40,
      budget: "above-3000",
      deliveryDate: inDays(9),
      products: [{ id: "tea-gift-box", name: "Himalayan Tea Collection", units: 40 }],
      customisations: ["Laser engraving"],
      message: "",
      order: {
        items,
        total: orderTotal(items),
        expectedDelivery: inDays(8),
        stage: "In production",
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
  const next = read().map((e) => (e.id === id ? change(e) : e));
  write(next);
  return next.find((e) => e.id === id);
}

const samePhone = (a: string, b: string) => normalisePhone(a).slice(-10) === normalisePhone(b).slice(-10);

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
  // A customer can see an enquiry only with its reference and their phone number
  track: (refs: EnquiryRef[]) =>
    read().filter((e) => refs.some((r) => r.id === e.id && samePhone(r.phone, e.phone))),
  setStatus: (id: string, status: EnquiryStatus) => update(id, (e) => ({ ...e, status })),
  finalise: (id: string, draft: OrderDraft) => {
    const now = new Date().toISOString();
    const stage: OrderStage = "Confirmed";
    return update(id, (e) => ({
      ...e,
      status: "Converted",
      order: { ...draft, total: orderTotal(draft.items), stage, confirmedAt: now, updatedAt: now },
    }));
  },
  updateOrder: (id: string, changes: OrderChanges) =>
    update(id, (e) =>
      e.order ? { ...e, order: { ...e.order, ...changes, updatedAt: new Date().toISOString() } } : e,
    ),
};
