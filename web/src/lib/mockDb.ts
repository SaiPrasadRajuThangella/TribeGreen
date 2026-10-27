import type { Enquiry, EnquiryInput, EnquiryStatus } from "@/types";

/*
 * Stand-in for the backend while it is being built.
 * Enquiries live in this browser's localStorage, seeded with a few samples
 * (from the app and the website) so the admin page has something to show.
 */

const KEY = "tg-mock-enquiries";

// Demo-only admin login, used only in mock mode. The real backend checks its own credentials.
export const MOCK_ADMIN = { username: "admin", password: "tribegreen" };
export const MOCK_TOKEN = "mock-admin-token";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const SEED: Enquiry[] = [
  {
    id: "TG-8K2QXA",
    source: "app",
    status: "New",
    createdAt: daysAgo(0.2),
    name: "Priya Menon",
    company: "Northwind Analytics",
    phone: "9845012345",
    email: "priya@northwind.example",
    occasion: "Corporate Diwali Gifting",
    units: 150,
    budget: "500-1500",
    deliveryDate: inDays(18),
    products: [
      { id: "scented-candle", name: "Spiced Soy Candle" },
      { id: "travel-tumbler", name: "Commuter Steel Tumbler" },
    ],
    customisations: ["Logo printing"],
    message: "Need individual gift boxes with a thank-you card.",
  },
  {
    id: "TG-7HD31M",
    source: "website",
    status: "Contacted",
    createdAt: daysAgo(1.4),
    name: "Rahul Verma",
    company: "Brightpath Learning",
    phone: "9811122233",
    email: "rahul.v@brightpath.example",
    occasion: "Employee Onboarding",
    units: 60,
    budget: "1500-3000",
    deliveryDate: inDays(25),
    products: [
      { id: "laptop-backpack", name: "Metro Laptop Backpack" },
      { id: "steel-bottle", name: "Aqua Steel Bottle" },
      { id: "leather-notebook", name: "Heritage Leather Diary" },
    ],
    customisations: ["Logo printing", "Name personalisation"],
    message: "Welcome kits for our new Bengaluru office.",
  },
  {
    id: "TG-5RT9LP",
    source: "app",
    status: "Converted",
    createdAt: daysAgo(4),
    name: "Sneha Iyer",
    company: "Kestrel Foods",
    phone: "9900887766",
    email: "sneha@kestrel.example",
    occasion: "Client and Vendor Gifting",
    units: 40,
    budget: "above-3000",
    deliveryDate: inDays(9),
    products: [{ id: "tea-gift-box", name: "Himalayan Tea Collection" }],
    customisations: ["Laser engraving"],
    message: "",
  },
  {
    id: "TG-3MV8QE",
    source: "website",
    status: "Lost",
    createdAt: daysAgo(7),
    name: "Arjun Kapoor",
    company: "Helix Robotics",
    phone: "9876501234",
    email: "arjun@helix.example",
    occasion: "Events and Trade Shows",
    units: 500,
    budget: "under-500",
    deliveryDate: inDays(4),
    products: [
      { id: "baseball-cap", name: "Six-Panel Cap" },
      { id: "polo-tshirt", name: "Pique Polo T-shirt" },
    ],
    customisations: ["Logo printing"],
    message: "Booth giveaways for a 3-day expo.",
  },
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

export const mockDb = {
  list: () => read(),
  create(input: EnquiryInput): Enquiry {
    const enquiry: Enquiry = {
      ...input,
      id: `TG-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      source: "website",
      status: "New",
      createdAt: new Date().toISOString(),
    };
    write([enquiry, ...read()]);
    return enquiry;
  },
  setStatus(id: string, status: EnquiryStatus) {
    const next = read().map((e) => (e.id === id ? { ...e, status } : e));
    write(next);
    return next.find((e) => e.id === id);
  },
};
