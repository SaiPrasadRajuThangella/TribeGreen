# Tribe Green — Catalogue and Enquiry System

A small catalogue and enquiry system for Tribe Green (corporate gifting), built as the V Green Media App and Web Developer assignment.

## Structure

```
tribe-green/
├── backend/   Node.js + Express + MongoDB API (in progress)
├── web/       React + Vite website and admin page (in progress)
└── mobile/    React Native (Expo) Android app
```

## Mobile app

**Stack:** Expo SDK 58 · Expo Router · NativeWind (Tailwind) · Reanimated · FlashList · Zustand + AsyncStorage · Zod · Plus Jakarta Sans

**Requires Node.js 22.13 or newer** (Expo SDK 58 does not support Node 20).

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
