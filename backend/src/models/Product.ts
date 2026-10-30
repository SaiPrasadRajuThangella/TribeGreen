import { type InferSchemaType, model, Schema } from "mongoose";

import { CATEGORIES, MIN_ORDER, OCCASIONS } from "../domain.js";
import { offeredCustomisations, type Priced, priceRange } from "../lib/pricing.js";

// Sizes or colours a gift comes in; buyers split units across them (10 M + 10 L)
const optionSchema = new Schema(
  {
    name: { type: String, enum: ["Size", "Colour"], required: true },
    values: { type: [String], required: true },
  },
  { _id: false },
);

// Extra per unit for each customisation the gift offers; missing means not offered
const customisationPricesSchema = new Schema(
  { "Logo printing": Number, "Laser engraving": Number, "Name personalisation": Number },
  { _id: false },
);

const productSchema = new Schema(
  {
    _id: { type: String, required: true }, // readable slug, e.g. "steel-bottle"
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 }, // per unit, plain
    occasions: { type: [String], enum: OCCASIONS, default: [] },
    customisationPrices: { type: customisationPricesSchema, default: {} },
    images: { type: [String], default: [] },
    minOrder: { type: Number, default: MIN_ORDER },
    option: { type: optionSchema, default: undefined },
    tag: { type: String, enum: ["Bestseller", "New", "Eco"] },
    sort: { type: Number, default: 0 }, // catalogue order
  },
  {
    versionKey: false,
    toJSON: {
      // Also sends what clients need to show: the offered customisations and the price range
      transform(_doc, ret: Record<string, unknown>) {
        const priced = ret as unknown as Priced;
        const { min, max } = priceRange(priced);
        ret.id = ret._id;
        ret.customisations = offeredCustomisations(priced);
        ret.priceMin = min;
        ret.priceMax = max;
        delete ret._id;
        delete ret.sort;
        return ret;
      },
    },
  },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
