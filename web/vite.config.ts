import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { seoPages } from "./build/seoPages.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // `npm run dev` and `npm run preview` send /api to the backend (cd backend && npm run dev)
  const proxy = { "/api": { target: env.VITE_DEV_API || "http://localhost:4000", changeOrigin: true } };
  return {
    server: { proxy },
    preview: { proxy },
    plugins: [react(), tailwindcss(), seoPages(env.VITE_SITE_URL || "https://tribegreen.vercel.app")],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
