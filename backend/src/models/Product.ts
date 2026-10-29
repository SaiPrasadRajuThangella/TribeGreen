import { type InferSchemaType, model, Schema } from "mongoose";

import { CATEGORIES, CUSTOMISATIONS, MIN_ORDER, OCCASIONS } from "../domain.js";

// Sizes or colours a gift comes in; buyers split units across them (10 M + 10 L)
const optionSchema = new Schema(
  {
    name: { type: String, enum: ["Size", "Colour"], required: true },
    values: { type: [String], required: true },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    _id: { type: String, required: true }, // readable slug, e.g. "steel-bottle"
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    priceMin: { type: Number, required: true, min: 0 },
    priceMax: { type: Number, required: true, min: 0 },
    occasions: { type: [String], enum: OCCASIONS, default: [] },
    customisations: { type: [String], enum: CUSTOMISATIONS, default: [] },
    images: { type: [String], default: [] },
    minOrder: { type: Number, default: MIN_ORDER },
    option: { type: optionSchema, default: undefined },
    tag: { type: String, enum: ["Bestseller", "New", "Eco"] },
    sort: { type: Number, default: 0 }, // catalogue order
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.sort;
        return ret;
      },
    },
  },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
