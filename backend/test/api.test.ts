import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import type { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Settings for the test run; set before the app reads its config
Object.assign(process.env, {
  NODE_ENV: "test",
  SEED_SAMPLES: "false",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "test-password-123",
  OTP_MODE: "fixed",
  FIXED_OTP: "123456",
  // The MongoDB copy in backend/node_modules, even when the tests start from the repo root
  MONGOMS_DOWNLOAD_DIR:
    process.env.MONGOMS_DOWNLOAD_DIR ??
    fileURLToPath(new URL("../node_modules/.cache/mongodb-memory-server", import.meta.url)),
});

let mongo: MongoMemoryServer;
let app: Express;
let stopDb: () => Promise<void>;

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

async function signIn(phone: string) {
  await request(app).post("/api/auth/otp").send({ phone }).expect(200);
  const res = await request(app).post("/api/auth/verify").send({ phone, code: "123456" }).expect(200);
  return res.body as { token: string; user: { profileComplete: boolean; phone: string } };
}

const validEnquiry = () => ({
  name: "Kavya Rao",
  company: "Orbit Labs",
  phone: "98450 11111",
  email: "KAVYA@orbit.example",
  occasion: "Employee Onboarding",
  budget: "500-1500",
  deliveryDate: inDays(20),
  message: "Our logo, please.",
  products: [
    {
      id: "premium-hoodie",
      units: 20,
      variants: [
        { label: "L", units: 10 },
        { label: "M", units: 10 },
      ],
      customisations: ["Name personalisation", "Logo printing"],
    },
    { id: "laptop-backpack", units: 10, customisations: [] },
  ],
});

before(async () => {
  mongo = await MongoMemoryServer.create();
  const { connectDb, disconnectDb } = await import("../src/db.js");
  const { prepareDatabase } = await import("../src/lib/seeding.js");
  const { createApp } = await import("../src/app.js");
  await connectDb(mongo.getUri());
  await prepareDatabase();
  app = createApp();
  stopDb = disconnectDb;
});

after(async () => {
  await stopDb();
  await mongo.stop();
});

describe("catalogue", () => {
  it("lists the 12 gifts in catalogue order, with sizes on clothes", async () => {
    const res = await request(app).get("/api/products").expect(200);
    assert.equal(res.body.length, 12);
    assert.equal(res.body[0].id, "steel-bottle");
    const hoodie = res.body.find((p: { id: string }) => p.id === "premium-hoodie");
    assert.deepEqual(hoodie.option.values, ["XS", "S", "M", "L", "XL", "XXL"]);
    assert.equal(hoodie.minOrder, 10);
  });

  it("prices each gift from its base plus what each customisation adds", async () => {
    const res = await request(app).get("/api/products/steel-bottle").expect(200);
    const bottle = res.body;
    assert.equal(bottle.basePrice, 380);
    assert.deepEqual(bottle.customisations, ["Logo printing", "Laser engraving", "Name personalisation"]);
    assert.equal(bottle.priceMin, 380); // plain
    assert.equal(bottle.priceMax, 380 + 30 + 50 + 30); // every customisation
  });

  it("returns one gift, or 404", async () => {
    await request(app).get("/api/products/yoga-mat").expect(200);
    await request(app).get("/api/products/nope").expect(404);
  });
});

describe("customer sign-in", () => {
  it("signs in the demo customer with the fixed code", async () => {
    const { token, user } = await signIn("9999999999");
    assert.ok(token);
    assert.equal(user.profileComplete, true);
  });

  it("refuses a wrong code and a bad number", async () => {
    await request(app).post("/api/auth/otp").send({ phone: "9876543210" }).expect(200);
    const wrong = await request(app).post("/api/auth/verify").send({ phone: "9876543210", code: "000000" });
    assert.equal(wrong.status, 400);
    const bad = await request(app).post("/api/auth/otp").send({ phone: "12345" });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.errors.phone, "Enter a valid 10-digit mobile number");
  });

  it("signs up a new number, then completes the profile", async () => {
    const { token, user } = await signIn("+91 91234 56789");
    assert.equal(user.phone, "9123456789");
    assert.equal(user.profileComplete, false);
    const auth = { Authorization: `Bearer ${token}` };
    await request(app).patch("/api/me").set(auth).send({ name: "A" }).expect(400);
    const done = await request(app)
      .patch("/api/me")
      .set(auth)
      .send({ name: "Neha Shah", company: "Kite Co", email: "neha@kite.example" })
      .expect(200);
    assert.equal(done.body.profileComplete, true);
  });
});

describe("enquiries", () => {
  it("checks every gift against the catalogue", async () => {
    const cases: [string, (b: ReturnType<typeof validEnquiry>) => void, RegExp][] = [
      ["too few units", (b) => (b.products[1].units = 5), /at least 10 units/],
      ["sizes don't add up", (b) => (b.products[0].units = 25), /add up to 20, not 25/],
      ["unknown size", (b) => (b.products[0].variants![0].label = "XXXL"), /doesn't come in XXXL/],
      ["sizes missing", (b) => delete b.products[0].variants, /Pick sizes/],
      ["not offered", (b) => (b.products[1].customisations = ["Laser engraving"]), /doesn't offer laser engraving/],
      ["unknown gift", (b) => (b.products[1].id = "rocket"), /no longer in the catalogue/],
      ["date in the past", (b) => (b.deliveryDate = inDays(-1)), /in the future/],
    ];
    for (const [label, change, message] of cases) {
      const body = validEnquiry();
      change(body);
      const res = await request(app).post("/api/enquiries").send(body);
      assert.equal(res.status, 400, label);
      assert.match(res.body.message, message, label);
    }
  });

  it("creates an enquiry with totals from the gifts and a 2-hour call-back", async () => {
    const { token } = await signIn("9999999999");
    const res = await request(app)
      .post("/api/enquiries")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validEnquiry(), units: 999, customisations: [], budget: "under-500" })
      .expect(201);
    const e = res.body;
    assert.match(e.id, /^TG-[A-Z2-9]{6}$/);
    assert.equal(e.units, 30); // worked out, not the 999 sent
    assert.deepEqual(e.customisations, ["Logo printing", "Name personalisation"]);
    // Hoodie 1250 + logo 260 + names 180; backpack plain 1650
    assert.equal(e.products[0].listPrice, 1690);
    assert.equal(e.products[1].listPrice, 1650);
    // (20 × 1690 + 10 × 1650) / 30 units ≈ ₹1,677 a unit, whatever budget was sent
    assert.equal(e.budget, "1500-3000");
    assert.deepEqual(e.products[0].variants.map((v: { label: string }) => v.label), ["M", "L"]);
    assert.equal(e.products[0].name, "Essential Hoodie");
    assert.equal(e.email, "kavya@orbit.example");
    assert.equal(e.phone, "9845011111");
    assert.equal(e.status, "New");
    assert.equal(new Date(e.respondBy).getTime() - new Date(e.createdAt).getTime(), 2 * 3600000);
    assert.equal(e._id, undefined);
    assert.equal(e.user, undefined);
  });
});

describe("my orders", () => {
  it("shows a customer only their own enquiries", async () => {
    const demo = await signIn("9999999999");
    const other = await signIn("9123456789");
    const mine = await request(app).get("/api/my/enquiries").set("Authorization", `Bearer ${demo.token}`);
    assert.equal(mine.body.length, 1);
    const id = mine.body[0].id;
    const theirs = await request(app).get("/api/my/enquiries").set("Authorization", `Bearer ${other.token}`);
    assert.equal(theirs.body.length, 0);
    await request(app).get(`/api/my/enquiries/${id}`).set("Authorization", `Bearer ${other.token}`).expect(404);
    await request(app).get("/api/my/enquiries").expect(401);
  });

  it("changes the call-back number and keeps the enquiry on the account", async () => {
    const demo = await signIn("9999999999");
    const auth = { Authorization: `Bearer ${demo.token}` };
    const [enquiry] = (await request(app).get("/api/my/enquiries").set(auth)).body;
    await request(app).patch(`/api/my/enquiries/${enquiry.id}/phone`).set(auth).send({ phone: "123" }).expect(400);
    const res = await request(app)
      .patch(`/api/my/enquiries/${enquiry.id}/phone`)
      .set(auth)
      .send({ phone: "98450 22222" })
      .expect(200);
    assert.equal(res.body.phone, "9845022222");
    const again = await request(app).get("/api/my/enquiries").set(auth);
    assert.equal(again.body.length, 1);
  });
});

describe("admin", () => {
  let token = "";
  let id = "";
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("signs in only with the right password", async () => {
    await request(app).post("/api/admin/login").send({ username: "admin", password: "wrong" }).expect(401);
    const res = await request(app)
      .post("/api/admin/login")
      .send({ username: "Admin", password: "test-password-123" })
      .expect(200);
    token = res.body.token;
  });

  it("keeps customers and visitors out", async () => {
    await request(app).get("/api/admin/enquiries").expect(401);
    const demo = await signIn("9999999999");
    await request(app).get("/api/admin/enquiries").set("Authorization", `Bearer ${demo.token}`).expect(403);
  });

  it("lists enquiries and changes their status", async () => {
    const list = await request(app).get("/api/admin/enquiries").set(auth()).expect(200);
    id = list.body[0].id;
    const contacted = await request(app).patch(`/api/admin/enquiries/${id}`).set(auth()).send({ status: "Contacted" });
    assert.ok(contacted.body.contactedAt);
    const lost = await request(app)
      .patch(`/api/admin/enquiries/${id}`)
      .set(auth())
      .send({ status: "Lost", reason: "Quote not agreed" });
    assert.equal(lost.body.closedReason, "Quote not agreed");
    await request(app)
      .post(`/api/admin/enquiries/${id}/order`)
      .set(auth())
      .send({ items: [], expectedDelivery: inDays(10) })
      .expect(400);
    const reopened = await request(app).patch(`/api/admin/enquiries/${id}`).set(auth()).send({ status: "Contacted" });
    assert.equal(reopened.body.closedReason, undefined);
  });

  it("finalises an order with a tracking number, then moves it one stage at a time", async () => {
    const order = await request(app)
      .post(`/api/admin/enquiries/${id}/order`)
      .set(auth())
      .send({
        items: [
          { id: "premium-hoodie", unitPrice: 1390 },
          { id: "laptop-backpack", unitPrice: 1790 },
        ],
        expectedDelivery: inDays(12),
        note: "Proofs approved",
      })
      .expect(201);
    assert.equal(order.body.status, "Converted");
    assert.equal(order.body.order.total, 20 * 1390 + 10 * 1790);
    assert.match(order.body.order.trackingNumber, /^TGT-\d{6}-\d{4}$/);
    assert.ok(order.body.order.stageTimes.Confirmed);

    await request(app).post(`/api/admin/enquiries/${id}/order`).set(auth()).send(order.body.order).expect(409);

    const skip = await request(app).patch(`/api/admin/enquiries/${id}/order`).set(auth()).send({ stage: "Delivered" });
    assert.equal(skip.status, 400);
    assert.equal(skip.body.message, "Orders move one stage at a time");

    const forward = await request(app)
      .patch(`/api/admin/enquiries/${id}/order`)
      .set(auth())
      .send({ stage: "In production", note: "Printing today" })
      .expect(200);
    assert.equal(forward.body.order.stage, "In production");
    assert.ok(forward.body.order.stageTimes["In production"]);

    const back = await request(app)
      .patch(`/api/admin/enquiries/${id}/order`)
      .set(auth())
      .send({ stage: "Confirmed" })
      .expect(200);
    assert.equal(back.body.order.stageTimes["In production"], undefined);
  });

  it("shows the customer their order", async () => {
    const demo = await signIn("9999999999");
    const res = await request(app).get(`/api/my/enquiries/${id}`).set("Authorization", `Bearer ${demo.token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.order.stage, "Confirmed");
    assert.equal(res.body.order.note, "Printing today");
  });
});
