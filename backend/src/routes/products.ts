import { Router } from "express";

import { notFound } from "../lib/errors.js";
import { Product } from "../models/Product.js";

export const productsRouter = Router();

// The catalogue changes rarely, so browsers may reuse it for a minute
productsRouter.get("/", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(await Product.find().sort({ sort: 1 }));
});

productsRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound("Gift not found");
  res.set("Cache-Control", "public, max-age=60");
  res.json(product);
});
