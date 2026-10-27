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
| Catalogue | `/catalogue` | Search, sort, and filters by category, occasion and budget. Filters live in the URL, so a filtered view can be shared |
| Product | `/product/:id` | Photo, price range, quantity estimate, occasions, customisation, WhatsApp button with a pre-filled message about the product |
| Enquiry list | drawer | Products picked for one quote, with units and an estimated budget |
| Enquiry form | `/enquiry` | All brief fields, validated (phone, email, quantity, date) |
| Thank you | `/thank-you/:id` | Confirmation with the enquiry reference |
| Admin login | `/admin/login` | Sign in to the admin page |
| Admin | `/admin` | All enquiries from the website and the app, with source, status (New, Contacted, Converted, Lost), search, filters, a details panel and CSV download |

### Page title, description and share image

- While someone browses, `useSeo()` (`web/src/hooks/useSeo.ts`) keeps `<title>`, the description and the Open Graph / Twitter tags in sync on every page.
- WhatsApp, LinkedIn and Google don't run JavaScript. So at build time `web/build/seoPages.ts` writes a static HTML file for each page (catalogue, enquiry and every product), each with its own title, description and share image.

### Demo mode

Until the backend is connected, the site runs on mock data:

- Products come from `web/src/data/products.ts`.
- Enquiries are saved in the browser's localStorage, which is seeded with sample enquiries from both the app and the website.
- **Admin demo login:** username `admin`, password `tribegreen`. This works only in demo mode; the backend will check its own credentials.

To use the real API, copy `web/.env.example` to `web/.env` and set `VITE_API_URL`.

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
