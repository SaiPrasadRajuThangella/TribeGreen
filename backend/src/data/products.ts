import { type Category, type Customisation, MIN_ORDER, type Occasion } from "../domain.js";

// The catalogue, synced into MongoDB on every start (npm run seed does it on demand).
// Same data as web/src/data/products.ts, which the website uses for share tags at build time.

export type ProductOption = { name: "Size" | "Colour"; values: string[] };

export type SeedProduct = {
  id: string;
  name: string;
  category: Category;
  shortDescription: string;
  description: string;
  basePrice: number; // per unit, plain
  occasions: Occasion[];
  customisationPrices: Partial<Record<Customisation, number>>; // extra per unit, for what it offers
  images: string[];
  minOrder: number;
  option?: ProductOption;
  tag?: "Bestseller" | "New" | "Eco";
};

const SIZES: ProductOption = { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] };
const colours = (...values: string[]): ProductOption => ({ name: "Colour", values });

// Free Unsplash photos, resized on Unsplash's CDN
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=75&fm=jpg&fit=crop&auto=format`;

export const PRODUCTS: SeedProduct[] = [
  {
    id: "steel-bottle",
    name: "Aqua Steel Bottle",
    category: "Drinkware",
    shortDescription: "750 ml double-wall insulated bottle.",
    description:
      "A leak-proof, double-wall stainless steel bottle that keeps drinks cold for 24 hours and hot for 12. Powder-coated finish takes logo printing and laser engraving beautifully.",
    basePrice: 380,
    occasions: ["Employee Onboarding", "Events and Trade Shows", "Employee Recognition"],
    customisationPrices: { "Logo printing": 30, "Laser engraving": 50, "Name personalisation": 30 },
    images: [img("photo-1782582270361-262dac15aa4f")],
    minOrder: MIN_ORDER,
    option: colours("Black", "White", "Sage", "Navy"),
    tag: "Bestseller",
  },
  {
    id: "ceramic-mug",
    name: "Classic Ceramic Mug",
    category: "Drinkware",
    shortDescription: "350 ml matte ceramic coffee mug.",
    description:
      "A sturdy matte-finish ceramic mug with a comfortable handle. Dishwasher and microwave safe. A desk favourite that keeps your brand in front of people every morning.",
    basePrice: 220,
    occasions: [
      "Employee Onboarding",
      "Corporate Diwali Gifting",
      "New Year Gifts",
      "Events and Trade Shows",
    ],
    customisationPrices: { "Logo printing": 80, "Name personalisation": 80 },
    images: [img("photo-1616241673111-508b4662c707")],
    minOrder: MIN_ORDER,
  },
  {
    id: "travel-tumbler",
    name: "Commuter Steel Tumbler",
    category: "Drinkware",
    shortDescription: "Insulated 500 ml tumbler with slide lid.",
    description:
      "A vacuum-insulated tumbler with a splash-proof slide lid that fits most car cup holders. Perfect for coffee on the go and a premium pick for client hampers.",
    basePrice: 650,
    occasions: ["Client and Vendor Gifting", "Corporate Diwali Gifting", "New Year Gifts"],
    customisationPrices: { "Logo printing": 100, "Laser engraving": 140 },
    images: [img("photo-1581157019452-2b854e1a020a")],
    minOrder: MIN_ORDER,
    tag: "New",
  },
  {
    id: "premium-hoodie",
    name: "Essential Hoodie",
    category: "Apparel",
    shortDescription: "Heavyweight 320 GSM cotton-blend hoodie.",
    description:
      "A soft brushed-fleece pullover hoodie in a relaxed fit. Embroidered or printed logo on the chest, in sizes XS to XXL. The team-swag piece people actually wear.",
    basePrice: 1250,
    occasions: ["Employee Onboarding", "Employee Recognition", "Events and Trade Shows"],
    customisationPrices: { "Logo printing": 260, "Name personalisation": 180 },
    images: [img("photo-1620799140188-3b2a02fd9a77")],
    minOrder: MIN_ORDER,
    option: SIZES,
    tag: "Bestseller",
  },
  {
    id: "polo-tshirt",
    name: "Pique Polo T-shirt",
    category: "Apparel",
    shortDescription: "Breathable 220 GSM cotton pique polo.",
    description:
      "A classic pique polo with a ribbed collar and two-button placket. Breathable, shrink-resistant cotton that looks sharp at offsites, events and trade-show booths.",
    basePrice: 450,
    occasions: ["Events and Trade Shows", "Employee Onboarding"],
    customisationPrices: { "Logo printing": 240 },
    images: [img("photo-1714317438040-0e8584215699")],
    minOrder: MIN_ORDER,
    option: SIZES,
  },
  {
    id: "baseball-cap",
    name: "Six-Panel Cap",
    category: "Apparel",
    shortDescription: "Structured cotton twill cap, adjustable.",
    description:
      "A structured six-panel cap in cotton twill with a curved brim and metal buckle strap. Embroider your logo on the front panel for a clean, premium look.",
    basePrice: 280,
    occasions: ["Events and Trade Shows", "Employee Recognition"],
    customisationPrices: { "Logo printing": 140 },
    images: [img("photo-1691256676359-20e5c6d4bc92")],
    minOrder: MIN_ORDER,
    option: colours("Black", "Navy", "Beige", "White"),
  },
  {
    id: "leather-notebook",
    name: "Heritage Leather Diary",
    category: "Work Essentials",
    shortDescription: "A5 vegan-leather diary, 192 pages.",
    description:
      "An A5 hardbound diary wrapped in soft vegan leather with an elastic closure and ribbon marker. Deboss your logo on the cover and add each recipient's name.",
    basePrice: 520,
    occasions: ["New Year Gifts", "Client and Vendor Gifting", "Employee Onboarding"],
    customisationPrices: { "Laser engraving": 150, "Name personalisation": 120 },
    images: [img("photo-1679891984409-0a3b1c4984ac")],
    minOrder: MIN_ORDER,
    tag: "Bestseller",
  },
  {
    id: "laptop-backpack",
    name: "Metro Laptop Backpack",
    category: "Work Essentials",
    shortDescription: 'Water-resistant, fits 15.6" laptops.',
    description:
      "A sleek water-resistant backpack with a padded laptop sleeve, hidden anti-theft pocket and USB charging port. Built for daily commutes and business travel.",
    basePrice: 1650,
    occasions: ["Employee Onboarding", "Employee Recognition", "Client and Vendor Gifting"],
    customisationPrices: { "Logo printing": 490, "Name personalisation": 350 },
    images: [img("photo-1553062407-98eeb64c6a62")],
    minOrder: MIN_ORDER,
  },
  {
    id: "wireless-charger",
    name: "Wireless Charging Stand",
    category: "Work Essentials",
    shortDescription: "15W fast-charging stand for desks.",
    description:
      "A 15W Qi fast-charging stand that holds phones upright for calls and notifications. Minimal matte finish takes laser engraving and logo printing cleanly.",
    basePrice: 990,
    occasions: ["Client and Vendor Gifting", "Corporate Diwali Gifting", "New Year Gifts"],
    customisationPrices: { "Logo printing": 180, "Laser engraving": 220 },
    images: [img("photo-1778854096628-0266421cac9e")],
    minOrder: MIN_ORDER,
  },
  {
    id: "yoga-mat",
    name: "Sage Yoga Kit",
    category: "Wellness",
    shortDescription: "6 mm non-slip mat with two cork blocks.",
    description:
      "A 6 mm eco TPE mat with a non-slip grip, paired with two natural cork blocks and a carry strap. A thoughtful gift for wellness-first teams.",
    basePrice: 1890,
    occasions: ["Employee Recognition", "New Year Gifts"],
    customisationPrices: { "Logo printing": 450, "Laser engraving": 350 },
    images: [img("photo-1646239646963-b0b9be56d6b5")],
    minOrder: MIN_ORDER,
    option: colours("Sage", "Lavender", "Charcoal"),
    tag: "Eco",
  },
  {
    id: "scented-candle",
    name: "Spiced Soy Candle",
    category: "Wellness",
    shortDescription: "Hand-poured soy candle in an amber jar.",
    description:
      "A hand-poured soy wax candle with notes of cinnamon, clove and sandalwood in a reusable amber jar, packed in a kraft gift box. A warm favourite for Diwali hampers.",
    basePrice: 790,
    occasions: ["Corporate Diwali Gifting", "Client and Vendor Gifting"],
    customisationPrices: { "Logo printing": 200, "Name personalisation": 160 },
    images: [img("photo-1768690569742-9705f4c98f22")],
    minOrder: MIN_ORDER,
  },
  {
    id: "tea-gift-box",
    name: "Himalayan Tea Collection",
    category: "Wellness",
    shortDescription: "Four single-estate loose-leaf teas.",
    description:
      "Four single-estate loose-leaf teas from Darjeeling, Assam and Nilgiri in glass jars, presented in a wooden gift crate. A premium gift for clients and leadership.",
    basePrice: 2450,
    occasions: ["Corporate Diwali Gifting", "Client and Vendor Gifting", "New Year Gifts"],
    customisationPrices: { "Logo printing": 500, "Laser engraving": 650 },
    images: [img("photo-1645869794108-400133a0c1c6")],
    minOrder: MIN_ORDER,
    tag: "New",
  },
];
