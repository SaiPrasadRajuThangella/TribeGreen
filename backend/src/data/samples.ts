import { config } from "../config.js";

// Sample enquiries for an empty database, so the admin page and the demo account have data.
// Times are relative to when the seed runs.

export const DEMO_CUSTOMER = {
  phone: "9999999999",
  name: "Demo Customer",
  company: "Tribe Green Demo",
  email: "demo@tribegreen.example",
};

const HOUR = 3600000;

export function sampleEnquiries(demoUserId: unknown, now = Date.now()) {
  const ago = (h: number) => new Date(now - h * HOUR);
  const inDays = (d: number) => new Date(now + d * 24 * HOUR).toISOString().slice(0, 10);
  const replyBy = (createdAt: Date) => new Date(createdAt.getTime() + config.REPLY_WITHIN_HOURS * HOUR);
  const base = (createdAt: Date) => ({ createdAt, respondBy: replyBy(createdAt), message: "" });

  return [
    /* ---------- The demo customer's own (phone 9999999999) ---------- */
    {
      ...base(ago(0.5)),
      ref: "TG-9MX2KD",
      user: demoUserId,
      source: "website",
      status: "New",
      ...DEMO_CUSTOMER,
      occasion: "New Year Gifts",
      units: 40,
      deliveryDate: inDays(30),
      products: [
        {
          id: "travel-tumbler",
          name: "Commuter Steel Tumbler",
          units: 40,
          customisations: ["Laser engraving"],
        },
      ],
      customisations: ["Laser engraving"],
      message: "Our new logo, please. Can you share a mock-up?",
    },
    {
      ...base(ago(120)),
      ref: "TG-4QW7RT",
      user: demoUserId,
      source: "website",
      status: "Converted",
      contactedAt: ago(119),
      ...DEMO_CUSTOMER,
      occasion: "Employee Onboarding",
      units: 45,
      deliveryDate: inDays(10),
      products: [
        {
          id: "premium-hoodie",
          name: "Essential Hoodie",
          units: 25,
          variants: [
            { label: "M", units: 10 },
            { label: "L", units: 10 },
            { label: "XL", units: 5 },
          ],
          customisations: ["Logo printing", "Name personalisation"],
        },
        { id: "laptop-backpack", name: "Metro Laptop Backpack", units: 20, customisations: ["Logo printing"] },
      ],
      customisations: ["Logo printing", "Name personalisation"],
      message: "Welcome kits for the March batch.",
      order: {
        items: [
          {
            id: "premium-hoodie",
            name: "Essential Hoodie",
            units: 25,
            variants: [
              { label: "M", units: 10 },
              { label: "L", units: 10 },
              { label: "XL", units: 5 },
            ],
            customisations: ["Logo printing", "Name personalisation"],
            unitPrice: 1390,
          },
          {
            id: "laptop-backpack",
            name: "Metro Laptop Backpack",
            units: 20,
            customisations: ["Logo printing"],
            unitPrice: 1790,
          },
        ],
        total: 25 * 1390 + 20 * 1790,
        expectedDelivery: inDays(7),
        stage: "In production",
        stageTimes: { Confirmed: ago(96), "In production": ago(30) },
        trackingNumber: "TGT-261025-6142",
        note: "Name list received. Embroidery is under way.",
        confirmedAt: ago(96),
        updatedAt: ago(30),
      },
    },

    /* ---------- Other customers, from the website and the app ---------- */
    {
      ...base(ago(0.6)),
      ref: "TG-8K2QXA",
      source: "app",
      status: "New",
      name: "Priya Menon",
      company: "Northwind Analytics",
      phone: "9845012345",
      email: "priya@northwind.example",
      occasion: "Corporate Diwali Gifting",
      units: 150,
      deliveryDate: inDays(18),
      products: [
        { id: "scented-candle", name: "Spiced Soy Candle", units: 100, customisations: ["Logo printing"] },
        { id: "travel-tumbler", name: "Commuter Steel Tumbler", units: 50, customisations: ["Logo printing"] },
      ],
      customisations: ["Logo printing"],
      message: "Need individual gift boxes with a thank-you card.",
    },
    {
      ...base(ago(3)),
      ref: "TG-6PZ2NC",
      source: "website",
      status: "New",
      name: "Sameer Khan",
      company: "Lumen Fintech",
      phone: "9123456780",
      email: "sameer@lumen.example",
      occasion: "Employee Recognition",
      units: 110,
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
    },
    {
      ...base(ago(34)),
      ref: "TG-7HD31M",
      source: "website",
      status: "Contacted",
      contactedAt: ago(33),
      name: "Rahul Verma",
      company: "Brightpath Learning",
      phone: "9811122233",
      email: "rahul.v@brightpath.example",
      occasion: "Employee Onboarding",
      units: 60,
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
        { id: "leather-notebook", name: "Heritage Leather Diary", units: 20, customisations: ["Logo printing"] },
      ],
      customisations: ["Logo printing", "Laser engraving", "Name personalisation"],
      message: "Welcome kits for our new Bengaluru office.",
    },
    {
      ...base(ago(96)),
      ref: "TG-5RT9LP",
      source: "app",
      status: "Converted",
      contactedAt: ago(94),
      name: "Sneha Iyer",
      company: "Kestrel Foods",
      phone: "9900887766",
      email: "sneha@kestrel.example",
      occasion: "Client and Vendor Gifting",
      units: 40,
      deliveryDate: inDays(9),
      products: [
        { id: "tea-gift-box", name: "Himalayan Tea Collection", units: 40, customisations: ["Laser engraving"] },
      ],
      customisations: ["Laser engraving"],
      order: {
        items: [
          {
            id: "tea-gift-box",
            name: "Himalayan Tea Collection",
            units: 40,
            customisations: ["Laser engraving"],
            unitPrice: 2890,
          },
        ],
        total: 40 * 2890,
        expectedDelivery: inDays(8),
        stage: "Dispatched",
        stageTimes: { Confirmed: ago(72), "In production": ago(48), Dispatched: ago(6) },
        trackingNumber: "TGT-261026-3307",
        note: "Shipped with BlueDart from Hyderabad.",
        confirmedAt: ago(72),
        updatedAt: ago(6),
      },
    },
    {
      ...base(ago(168)),
      ref: "TG-3MV8QE",
      source: "website",
      status: "Lost",
      contactedAt: ago(166),
      closedAt: ago(140),
      closedReason: "Quote not agreed",
      name: "Arjun Kapoor",
      company: "Helix Robotics",
      phone: "9876501234",
      email: "arjun@helix.example",
      occasion: "Events and Trade Shows",
      units: 500,
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
    },
  ];
}
