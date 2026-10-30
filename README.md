# Tribe Green — Catalogue and Enquiry System

A small catalogue and enquiry system for Tribe Green (corporate gifting), built as the V Green Media App and Web Developer assignment.

## Structure

```
tribe-green/
├── package.json   one-command scripts for the whole repo
├── backend/       Node.js + Express + MongoDB API
├── web/           React + Vite website and admin page
└── mobile/        React Native (Expo) Android app
```

A monorepo: the root starts everything, and each folder is still its own project with its own `package.json`, so it can also be run, built and deployed on its own.

**Requires Node.js 22.13 or newer** (Expo SDK 58 needs it). With nvm: `nvm use 22.17.0` (see `.nvmrc`).

## Quick start

From the repo root:

```bash
npm install
npm run dev
```

`npm install` also installs `backend/`, `web/` and `mobile/`. `npm run dev` starts all three:

| Part | Address |
|---|---|
| API (with a local MongoDB in `backend/.data`) | http://localhost:4000 |
| Website and admin | http://localhost:5173 |
| App (Expo / Metro) | http://localhost:8081 |

The website forwards `/api` to the backend. The app finds the backend on the same computer by itself.

| Command (root) | What it does |
|---|---|
| `npm run dev` | API + website + app. The app's QR code and shortcuts (`a` = Android, `r` = reload) show at the bottom; API and website lines are tagged `[api]` / `[web]`. Ctrl+C stops all three |
| `npm run dev:site` | API + website only |
| `npm run dev:backend` / `dev:web` / `dev:mobile` | One part on its own |
| `npm test` | Backend API tests |
| `npm run build` | Build the backend and the website |
| `npm run check` | Type-check and lint all three |

**On a phone:** scan the QR code from `npm run dev` with Expo Go. The phone must be on the same Wi-Fi as the computer. If you're on Node 20, `npm run dev` warns you: run `nvm use 22.17.0` first, because the app needs Node 22.

Each folder on its own works too, e.g. `cd backend && npm install && npm run dev`.

### Demo logins

| Who | Where | Login |
|---|---|---|
| Customer | Website `/login` or the app | Mobile `9999999999`, code `123456` |
| Admin | http://localhost:5173/admin | The `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env.example` |

No SMS provider is connected yet, so every number's sign-in code is `123456` (`OTP_MODE=fixed`). Any other number signs up a new customer, who then adds a name, company and email.

## Backend (`backend/`)

**Stack:** Node.js · Express 5 · MongoDB with Mongoose · Zod validation · JWT sign-in · bcrypt · Helmet · rate limiting · TypeScript

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API on http://localhost:4000 with auto-reload. Without `MONGODB_URI` it also starts a local MongoDB, kept in `backend/.data` |
| `npm test` | API tests against a throwaway database (sign-in, enquiry rules, ownership, admin access, order stages) |
| `npm run seed` | Syncs the catalogue, admin and demo customer; `npm run seed -- --reset` also restarts the enquiries from the samples |
| `npm run build` / `npm start` | Compile to `dist/` and run it (production) |

Settings live in `backend/.env` (copy `backend/.env.example`). On every start the API:

- syncs the 12 products from `backend/src/data/products.ts` into MongoDB,
- creates or updates the one admin from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (the password is stored hashed),
- creates the demo customer (9999999999),
- fills an empty database with sample enquiries from the website and the app (`SEED_SAMPLES=true`), two of them on the demo customer's account.

### What the API checks

- **Phone, email, quantity and dates** with the same rules and messages as the website form.
- **Every gift against the catalogue:** it exists, has at least 10 units, its sizes / colours are real and add up to the units, and its customisation is one the gift offers. Names, total units and the enquiry-wide customisation list are worked out on the server, not trusted from the client.
- **Ownership:** a customer sees only enquiries made while signed in or with their verified mobile number.
- **Admin only:** every `/api/admin` route needs the admin token; a customer token gets 403.
- **Orders** move one stage at a time and finalising creates a unique tracking number. Sign-in codes are stored hashed, expire after 5 minutes and lock after 5 wrong tries.

### API

Errors come back as `{ message, errors? }`, where `errors` maps a field to its message.

| Method | Path | Who | Used for |
|---|---|---|---|
| GET | `/api/products`, `/api/products/:id` | Anyone | Catalogue: `basePrice` and `customisationPrices`, plus the worked-out `customisations`, `priceMin` (plain) and `priceMax` (every customisation) |
| POST | `/api/auth/otp` | Anyone | `{ phone }`: send a sign-in code |
| POST | `/api/auth/verify` | Anyone | `{ phone, code }` → `{ token, user }`. Creates the account for a new number |
| GET, PATCH | `/api/me` | Customer | The profile; PATCH `{ name, company, email }` completes it |
| POST | `/api/enquiries` | Anyone | Send an enquiry (`source: "website"` or `"app"`). Signed in, it's linked to the account; both the website and the app sign in first. Returns it with `id`, `respondBy` (2 hours later), each gift's `listPrice` and the `budget` band worked out from the gifts |
| GET | `/api/my/enquiries`, `/api/my/enquiries/:id` | Customer | Their enquiries and orders |
| PATCH | `/api/my/enquiries/:id/phone` | Customer | `{ phone }`: change the call-back number |
| POST | `/api/admin/login` | Anyone | `{ username, password }` → `{ token }` |
| GET | `/api/admin/enquiries` | Admin | All enquiries from the website and the app |
| PATCH | `/api/admin/enquiries/:id` | Admin | `{ status, reason? }`. Lost records `closedAt` and the reason, e.g. "Quote not agreed" |
| POST | `/api/admin/enquiries/:id/order` | Admin | Finalise: `{ items: [{ id, unitPrice }], expectedDelivery, note }`. Sets the status to Converted and creates `trackingNumber` |
| PATCH | `/api/admin/enquiries/:id/order` | Admin | `{ stage?, expectedDelivery?, note? }`. One stage forwards or back; each stage's time is kept in `stageTimes` |

### Deploying to Render with MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) and copy its connection string.
2. On [Render](https://render.com), create a **Web Service** from the GitHub repo with **Root Directory** `backend`, build command `npm install && npm run build`, start command `npm start`.
3. Add the environment variables from `backend/.env.example`: `NODE_ENV=production`, `MONGODB_URI`, a long random `JWT_SECRET`, your own `ADMIN_PASSWORD`, and `CORS_ORIGIN` set to the website's address.
4. Set the website's `VITE_API_URL` to the Render address.

## Website (`web/`)

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · React Router 7 · Motion · Zustand · Zod · Plus Jakarta Sans

Start the backend first (see Quick start), then:

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
| Sign in | `/login` | Mobile number, then the 6-digit code; a new number adds name, company and email once. Sending an enquiry and My orders need it; browsing doesn't |
| Enquiry form | `/enquiry` | All brief fields, validated (phone, email, quantity, date), filled in from the account. Customisation is chosen per gift in the list beside the form. The form is saved as you type, so a trip to the catalogue (or to sign in) keeps it |
| Thank you | `/thank-you/:id` | Confirmation with the enquiry reference and the call-back time (within 2 hours) |
| My orders | `/orders` | Every enquiry on the account, including ones sent from the app with the same number: a countdown to the 2-hour call back (with an option to change the number to call), then, once the admin confirms the order, the items, prices, tracking number, progress and delivery date. Refreshes on its own |
| Order details | `/orders/:id` | Every step with its date and time: enquiry sent, quote call, confirmed, in production, dispatched, delivered (or cancelled, with the reason) |
| Admin login | `/admin/login` | Sign in to the admin page |
| Admin | `/admin` | All enquiries from the website and the app, with source, status (New, Contacted, Converted, Lost), a 2-hour call-back timer, search, filters, a details panel and CSV download. The details panel shows each gift's sizes / colours and customisation. If the quote is agreed, the admin finalises the order (price per unit, delivery date, note) and a tracking number is created; if not, it moves to Lost with the reason. Orders then move one stage at a time, forwards or back: Confirmed, In production, Dispatched, Delivered |

### Pricing

- Every gift has a **base price** per unit (plain) and a set **extra per unit for each customisation** it offers. For example, the bottle is ₹380, + ₹30 logo, + ₹50 engraving, + ₹30 names.
- The range shown is **plain → fully customised** (₹380 – ₹490). The price per unit is the base plus what was picked, so more customisation costs more.
- The list, form and My orders show an exact estimate (units × price). The admin's final price per unit starts from that list price and can be changed.
- The form doesn't ask for a budget. The brief's "budget per unit" is worked out by the server from the gifts (estimated total ÷ units) and shown in the admin and the CSV.
- Prices live in `backend/src/data/products.ts` (`basePrice`, `customisationPrices`) and are worked out in `backend/src/lib/pricing.ts`.

### Quantities

- Every gift starts at **10 units**.
- Gifts with sizes (hoodie, polo) or colours (bottle, cap, yoga kit) are ordered per variant, and the variants add up to the total. Adding one from the catalogue opens a picker.
- Each gift has its own customisation, limited to what that product offers (a hoodie can't be laser engraved).
- The enquiry stores each gift as `{ id, name, units, variants?: [{ label, units }], customisations?, listPrice }`. The enquiry-level `customisations` list (from the brief) is everything picked across the gifts.

### Page title, description and share image

- While someone browses, `useSeo()` (`web/src/hooks/useSeo.ts`) keeps `<title>`, the description and the Open Graph / Twitter tags in sync on every page.
- WhatsApp, LinkedIn and Google don't run JavaScript. So at build time `web/build/seoPages.ts` writes a static HTML file for each page (catalogue, enquiry and every product), each with its own title, description and share image.

### Where the data comes from

Everything comes from the backend: products, sign-in, enquiries, orders and the admin page. `web/src/data/products.ts` is a copy of the catalogue used only at build time, to write each product page's share tags.

### Deploying to Vercel

1. Import the GitHub repo in Vercel and set **Root Directory** to `web`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add the environment variables from `web/.env.example`. Set `VITE_API_URL` to the deployed backend and `VITE_SITE_URL` to the live site.

`web/vercel.json` serves the pre-rendered pages and sends every other path to the app.

## Mobile app (`mobile/`)

**Stack:** Expo SDK 58 · Expo Router · NativeWind (Tailwind) · Reanimated · FlashList · Zustand + AsyncStorage · Zod · Plus Jakarta Sans

Start the API first (`npm run dev:site` from the root), then:

```bash
cd mobile
npm install
npx expo start
```

Then press `a` for an Android emulator, or scan the QR code with **Expo Go** on an Android phone on the same Wi-Fi.

The app follows the same flow as the website, on the same backend and accounts: browse, pick sizes and customisation per gift, sign in with your mobile number, send, then track the call back and the order in Orders. Enquiries arrive in the admin marked **App**, and everything the admin changes shows up in the app.

### Screens

| Screen | What it does |
|---|---|
| Onboarding | First-launch welcome: sign in or create an account, or browse first |
| Home | Promo banners, categories, bestsellers, gift by occasion; Sign in, or your initials (opens Orders) |
| Catalogue | Search plus filters by occasion, budget and category (one, several or all) |
| Product detail | Price range (plain → fully customised), quantity by size / colour, customisation with what each adds, live price per unit and total, WhatsApp button |
| Size picker | Sheet for sizes / colours and customisation, from a product card or the list |
| Enquiry list | Each gift with its split, customisation pills and price; removing asks first; exact estimated total |
| Sign in | Mobile number, 6-digit code, and a one-time profile for new numbers |
| Enquiry form | All brief fields, filled in from the account and saved as you type; sending needs sign-in |
| Thank you | Reference, call-back time, gifts and estimated total |
| Orders | Current orders (delivery date, tracking number, progress, team's note), quotes waiting with a call-back countdown and "Change number", and past ones. Refreshes on its own and with pull to refresh |
| Order details | Every step with its date and time, gifts and prices, contact details |

### Data

Everything comes from the backend. In development the app uses the computer running Expo, port 4000 (`mobile/src/lib/config.ts`). For a deployed API, set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `mobile/.env.example`). The gift list, the form draft and the sign-in are kept on the phone.

Product photos are free images from [Unsplash](https://unsplash.com).

## Not done yet

- **Real SMS codes.** Sign-in codes are fixed to `123456`; `OTP_MODE=console` prints random ones in the server log instead. Sending them needs an SMS provider (e.g. MSG91 or Twilio) in `backend/src/lib/otp.ts`.
- **The APK.** Build it with EAS (`npx eas-cli build -p android --profile preview`), which needs an Expo account, and set `EXPO_PUBLIC_API_URL` to the deployed API first.
- **Not deployed.** The steps above need your own GitHub, Render, Atlas and Vercel accounts.
