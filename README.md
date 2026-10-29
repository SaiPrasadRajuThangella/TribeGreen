# Tribe Green — Catalogue and Enquiry System

A small catalogue and enquiry system for Tribe Green (corporate gifting), built as the V Green Media App and Web Developer assignment.

## Structure

```
tribe-green/
├── backend/   Node.js + Express + MongoDB API (in progress)
├── web/       React + Vite website and admin page
└── mobile/    React Native (Expo) Android app
```

Each folder is its own project with its own `package.json`. Run each one from inside its folder.

**Requires Node.js 22.13 or newer** (Expo SDK 58 and Vite 8 need it).

## Website (`web/`)

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · React Router 7 · Motion · Zustand · Zod · Plus Jakarta Sans

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

### Pages

| Page | Path | What it does |
|---|---|---|
| Home | `/` | Hero, categories, bestsellers, gift by occasion, how it works |
| Catalogue | `/catalogue` | Search, sort, and filters by occasion, budget and category (one, several or all, e.g. `?category=Drinkware&category=Apparel`). Filters live in the URL, so a filtered view can be shared |
| Product | `/product/:id` | Photo, price range, quantity with a live estimate, occasions, WhatsApp button with a pre-filled message about the product. Clothes take units per size and some gifts per colour (10 M + 10 L). Logo printing, laser engraving and name personalisation are picked here for this gift, from what it offers |
| Enquiry list | drawer | Products picked for one quote, with units or the size / colour split, each gift's customisation, and an estimated budget. Removing a gift asks first |
| Enquiry form | `/enquiry` | All brief fields, validated (phone, email, quantity, date). Customisation is chosen per gift in the list beside the form. The form is saved as you type, so a trip to the catalogue to add more gifts keeps it |
| Thank you | `/thank-you/:id` | Confirmation with the enquiry reference and the call-back time (within 2 hours) |
| My orders | `/orders` | Enquiries sent from this browser: a countdown to the 2-hour call back (with an option to change the number to call), then, once the admin confirms the order, the items, prices, tracking number, progress and delivery date. Orders from another device can be added with the reference or the mobile number |
| Order details | `/orders/:id` | Every step with its date and time: enquiry sent, quote call, confirmed, in production, dispatched, delivered (or cancelled, with the reason) |
| Admin login | `/admin/login` | Sign in to the admin page |
| Admin | `/admin` | All enquiries from the website and the app, with source, status (New, Contacted, Converted, Lost), a 2-hour call-back timer, search, filters, a details panel and CSV download. The details panel shows each gift's sizes / colours and customisation. If the quote is agreed, the admin finalises the order (price per unit, delivery date, note) and a tracking number is created; if not, it moves to Lost with the reason. Orders then move one stage at a time, forwards or back: Confirmed, In production, Dispatched, Delivered |

### Quantities

- Every gift starts at **10 units**.
- Gifts with sizes (hoodie, polo) or colours (bottle, cap, yoga kit) are ordered per variant, and the variants add up to the total. Adding one from the catalogue opens a picker.
- Each gift has its own customisation, limited to what that product offers (a hoodie can't be laser engraved).
- The enquiry stores each gift as `{ id, name, units, variants?: [{ label, units }], customisations? }`. The enquiry-level `customisations` list (from the brief) is everything picked across the gifts. The Android app still sends only that enquiry-level list.

### Page title, description and share image

- While someone browses, `useSeo()` (`web/src/hooks/useSeo.ts`) keeps `<title>`, the description and the Open Graph / Twitter tags in sync on every page.
- WhatsApp, LinkedIn and Google don't run JavaScript. So at build time `web/build/seoPages.ts` writes a static HTML file for each page (catalogue, enquiry and every product), each with its own title, description and share image.

### Demo mode

Until the backend is connected, the site runs on mock data:

- Products come from `web/src/data/products.ts`.
- Enquiries and orders are saved in the browser's localStorage, which is seeded with sample enquiries from both the app and the website. The admin page and My orders read the same storage, so an order confirmed in the admin tab shows up on My orders straight away.
- To try the order lookup, use the sample order `TG-5RT9LP` with its phone number from `web/src/lib/mockDb.ts`.
- **Admin demo login:** username `admin`, password `tribegreen`. This works only in demo mode; the backend will check its own credentials.

To use the real API, copy `web/.env.example` to `web/.env` and set `VITE_API_URL`. The site then calls:

| Method | Path | Used for |
|---|---|---|
| GET | `/api/products`, `/api/products/:id` | Catalogue |
| POST | `/api/enquiries` | Send an enquiry (`source: "website"`). Returns it with `id` and `respondBy` (2 hours later) |
| POST | `/api/enquiries/track` | `{ refs: [{ id, phone }] }` → the matching enquiries with their orders, for My orders |
| POST | `/api/enquiries/lookup` | `{ id }` or `{ phone }` → enquiries for the Track form |
| PATCH | `/api/enquiries/:id/phone` | `{ phone, newPhone }`: change the call-back number (the current number proves ownership) |
| POST | `/api/admin/login` | `{ username, password }` → `{ token }` |
| GET | `/api/admin/enquiries` | All enquiries (Bearer token) |
| PATCH | `/api/admin/enquiries/:id` | `{ status, reason? }`. Lost records `closedAt` and the reason, e.g. "Quote not agreed" |
| POST | `/api/admin/enquiries/:id/order` | Finalise: `{ items (with unitPrice), expectedDelivery, note }`. Sets the status to Converted and creates `trackingNumber` |
| PATCH | `/api/admin/enquiries/:id/order` | `{ stage?, expectedDelivery?, note? }`. The stage may only move one step forwards or back; each stage's time is kept in `stageTimes` |

### Deploying to Vercel

1. Import the GitHub repo in Vercel and set **Root Directory** to `web`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add the environment variables from `web/.env.example`. Set `VITE_SITE_URL` to the live URL.

`web/vercel.json` serves the pre-rendered pages and sends every other path to the app.

## Mobile app (`mobile/`)

**Stack:** Expo SDK 58 · Expo Router · NativeWind (Tailwind) · Reanimated · FlashList · Zustand + AsyncStorage · Zod · Plus Jakarta Sans

```bash
cd mobile
npm install
npx expo start
```

Then press `a` for an Android emulator, or scan the QR code with **Expo Go** on an Android phone.

### Screens

| Screen | What it does |
|---|---|
| Onboarding | First-launch welcome, shown once |
| Home | Promo banners, categories, bestsellers, gift by occasion |
| Catalogue | Search plus filters by category, occasion and budget band |
| Product detail | Photo, price range, occasions, customisation, WhatsApp button with a pre-filled message |
| Enquiry list | Products picked for a quote, units per product, estimated budget |
| Enquiry form | All brief fields, validated (phone, email, quantity, date) |
| Thank you | Confirmation with the enquiry reference |
| My enquiries | Every enquiry sent from this phone, saved on the device |

### Data

The app currently runs on mock data (`mobile/src/data/products.ts`), and submitted enquiries are saved on the phone. Once the backend is ready, copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL`. The app then switches to the real API (`mobile/src/lib/api.ts`) with no other changes.

Product photos are free images from [Unsplash](https://unsplash.com).
