import bcrypt from "bcryptjs";

import { config } from "../config.js";
import { PRODUCTS } from "../data/products.js";
import type { Customisation } from "../domain.js";
import { DEMO_CUSTOMER, sampleEnquiries } from "../data/samples.js";
import { Admin } from "../models/Admin.js";
import { Enquiry } from "../models/Enquiry.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

import { budgetBandFor, unitPrice } from "./pricing.js";

// Sample gifts get today's catalogue price, and the enquiry its budget per unit, like real ones
function priceSample<T extends { products: { id: string; units: number; customisations: string[] }[] }>(doc: T) {
  const products = doc.products.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id)!;
    return { ...item, listPrice: unitPrice(product, item.customisations as Customisation[]) };
  });
  const units = products.reduce((sum, p) => sum + p.units, 0);
  const estimate = products.reduce((sum, p) => sum + p.units * p.listPrice, 0);
  return { ...doc, products, budget: budgetBandFor(estimate / units) };
}

// The catalogue in code is the source of truth: insert new gifts, update changed ones
export async function syncCatalogue() {
  await Product.bulkWrite(
    PRODUCTS.map(({ id, ...product }, sort) => ({
      replaceOne: { filter: { _id: id }, replacement: { _id: id, ...product, sort }, upsert: true },
    })),
  );
  await Product.deleteMany({ _id: { $nin: PRODUCTS.map((p) => p.id) } });
}

// One admin, from ADMIN_USERNAME / ADMIN_PASSWORD. Changing the password there changes it here.
export async function ensureAdmin() {
  const username = config.ADMIN_USERNAME.toLowerCase();
  const admin = await Admin.findOne({ username });
  if (admin && (await bcrypt.compare(config.ADMIN_PASSWORD, admin.passwordHash))) return;
  const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
  await Admin.updateOne({ username }, { $set: { passwordHash } }, { upsert: true });
}

// The demo customer (9999999999), so the site can be tried without signing up
export async function ensureDemoCustomer() {
  return User.findOneAndUpdate(
    { phone: DEMO_CUSTOMER.phone },
    { $setOnInsert: DEMO_CUSTOMER },
    { upsert: true, returnDocument: "after" },
  );
}

export async function seedSamples({ reset = false } = {}) {
  if (reset) await Enquiry.deleteMany({});
  if ((await Enquiry.estimatedDocumentCount()) > 0) return 0;
  const demo = await ensureDemoCustomer();
  const docs = sampleEnquiries(demo._id).map(priceSample);
  await Enquiry.insertMany(docs);
  return docs.length;
}

// Runs on every start: safe to repeat
export async function prepareDatabase() {
  await syncCatalogue();
  await ensureAdmin();
  await ensureDemoCustomer();
  if (config.SEED_SAMPLES) {
    const added = await seedSamples();
    if (added) console.log(`Added ${added} sample enquiries`);
  }
}
