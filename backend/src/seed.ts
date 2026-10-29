/*
 * npm run seed            sync the catalogue, admin and demo customer; add samples if empty
 * npm run seed -- --reset also delete every enquiry and start again from the samples
 *
 * Uses MONGODB_URI, or the local database that `npm run dev` starts.
 */
import { config } from "./config.js";
import { connectDb, disconnectDb } from "./db.js";
import { ensureAdmin, ensureDemoCustomer, seedSamples, syncCatalogue } from "./lib/seeding.js";

const uri = config.MONGODB_URI || "mongodb://127.0.0.1:27018/tribegreen";
const reset = process.argv.includes("--reset");

try {
  await connectDb(uri);
} catch {
  console.error(`Can't reach MongoDB at ${uri}. Start the API with \`npm run dev\` first, or set MONGODB_URI.`);
  process.exit(1);
}

await syncCatalogue();
await ensureAdmin();
await ensureDemoCustomer();
const added = await seedSamples({ reset });
console.log(`Catalogue, admin and demo customer ready. ${added ? `Added ${added} sample enquiries.` : "Enquiries left as they were."}`);
await disconnectDb();
