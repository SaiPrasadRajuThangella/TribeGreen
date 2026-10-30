import { type HydratedDocumentFromSchema, type InferSchemaType, model, Schema } from "mongoose";

import { BUDGET_BANDS, CUSTOMISATIONS, OCCASIONS, ORDER_STAGES, SOURCES, STATUSES } from "../domain.js";

const variantSchema = new Schema(
  { label: { type: String, required: true }, units: { type: Number, required: true } },
  { _id: false },
);

// One gift in an enquiry. `id` is the product id, so the schema's own `id` getter is off.
const itemFields = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  units: { type: Number, required: true },
  variants: { type: [variantSchema], default: undefined },
  customisations: { type: [String], enum: CUSTOMISATIONS, default: [] },
  listPrice: Number, // catalogue price per unit with this customisation, when the enquiry was sent
};
const itemSchema = new Schema(itemFields, { _id: false, id: false });
const orderItemSchema = new Schema(
  { ...itemFields, unitPrice: { type: Number, required: true } },
  { _id: false, id: false },
);

// Created by the admin once the customer agrees to the quote
const orderSchema = new Schema(
  {
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    expectedDelivery: { type: String, required: true }, // yyyy-mm-dd
    stage: { type: String, enum: ORDER_STAGES, default: "Confirmed" },
    stageTimes: {
      Confirmed: Date,
      "In production": Date,
      Dispatched: Date,
      Delivered: Date,
    },
    trackingNumber: { type: String, required: true },
    note: { type: String, default: "" },
    confirmedAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const enquirySchema = new Schema(
  {
    ref: { type: String, required: true, unique: true }, // "TG-8K2QXA", shown to people
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    source: { type: String, enum: SOURCES, required: true },
    status: { type: String, enum: STATUSES, default: "New", index: true },

    name: { type: String, required: true },
    company: { type: String, required: true },
    phone: { type: String, required: true, index: true }, // 10 digits, the call-back number
    email: { type: String, required: true },
    occasion: { type: String, enum: OCCASIONS, required: true },
    units: { type: Number, required: true },
    budget: { type: String, enum: BUDGET_BANDS, required: true }, // worked out from the gifts
    deliveryDate: { type: String, required: true }, // yyyy-mm-dd
    products: { type: [itemSchema], required: true },
    customisations: { type: [String], enum: CUSTOMISATIONS, default: [] }, // all gifts together
    message: { type: String, default: "" },

    respondBy: { type: Date, required: true }, // the call-back promise
    contactedAt: Date,
    closedAt: Date,
    closedReason: String,
    order: { type: orderSchema, default: undefined },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      // The API speaks the website's shape: `id` is the reference, internal fields stay inside
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret.ref;
        delete ret.ref;
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

enquirySchema.index({ createdAt: -1 });

export type EnquiryFields = InferSchemaType<typeof enquirySchema>;
export type EnquiryDoc = HydratedDocumentFromSchema<typeof enquirySchema>;
export const Enquiry = model("Enquiry", enquirySchema);
