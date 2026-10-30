import cors from "cors";
import express from "express";
import helmet from "helmet";

import { config } from "./config.js";
import { errorHandler, notFoundRoute } from "./lib/errors.js";
import { meRouter, myRouter } from "./routes/account.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { enquiriesRouter } from "./routes/enquiries.js";
import { listsRouter } from "./routes/lists.js";
import { productsRouter } from "./routes/products.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind Render's proxy: rate limits see the real visitor
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/lists", listsRouter); // category, occasion, customisation, status and stage names
  app.use("/api/products", productsRouter);
  app.use("/api/auth", authRouter); // customer sign-in with phone + code
  app.use("/api/me", meRouter);
  app.use("/api/my", myRouter);
  app.use("/api/enquiries", enquiriesRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundRoute);
  app.use(errorHandler);
  return app;
}
