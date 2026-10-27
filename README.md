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

```bash
cd mobile
npm install
npx expo start
```

Press `a` to open it on an Android emulator, or scan the QR code with Expo Go on an Android phone.

The app currently runs on mock data (`mobile/src/data/products.ts`). When the backend is ready, set `EXPO_PUBLIC_API_URL` in `mobile/.env` and the app switches to the real API.
