import { Router } from "express";

import { CATEGORIES, CUSTOMISATIONS, OCCASIONS, ORDER_STAGES, STATUSES } from "../domain.js";

export const listsRouter = Router();

// The names the website and the app show, in display order, so neither keeps its own copy
listsRouter.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({
    categories: CATEGORIES,
    occasions: OCCASIONS,
    customisations: CUSTOMISATIONS,
    statuses: STATUSES,
    orderStages: ORDER_STAGES,
  });
});
