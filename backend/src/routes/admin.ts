import bcrypt from "bcryptjs";
import { Router } from "express";

import { requireAdmin, signToken } from "../lib/auth.js";
import { applyStatus, changeOrder, finaliseOrder, findByRef } from "../lib/enquiries.js";
import { HttpError } from "../lib/errors.js";
import { loginLimiter } from "../lib/limits.js";
import { loginSchema, orderChangesSchema, orderDraftSchema, statusSchema } from "../lib/validation.js";
import { Admin } from "../models/Admin.js";
import { Enquiry } from "../models/Enquiry.js";

export const adminRouter = Router();

adminRouter.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  const admin = await Admin.findOne({ username });
  // Same answer for an unknown username and a wrong password
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    throw new HttpError(401, "Incorrect username or password");
  }
  res.json({ token: signToken(String(admin._id), "admin") });
});

adminRouter.use(requireAdmin);

// Every enquiry from the website and the app, newest first
adminRouter.get("/enquiries", async (_req, res) => {
  res.json(await Enquiry.find().sort({ createdAt: -1 }));
});

adminRouter.patch("/enquiries/:id", async (req, res) => {
  const { status, reason } = statusSchema.parse(req.body);
  const enquiry = await findByRef(req.params.id);
  applyStatus(enquiry, status, reason);
  await enquiry.save();
  res.json(enquiry);
});

// Quote agreed: becomes an order with prices, a delivery date and a tracking number
adminRouter.post("/enquiries/:id/order", async (req, res) => {
  const draft = orderDraftSchema.parse(req.body);
  const enquiry = await findByRef(req.params.id);
  await finaliseOrder(enquiry, draft);
  await enquiry.save();
  res.status(201).json(enquiry);
});

adminRouter.patch("/enquiries/:id/order", async (req, res) => {
  const changes = orderChangesSchema.parse(req.body);
  const enquiry = await findByRef(req.params.id);
  changeOrder(enquiry, changes);
  await enquiry.save();
  res.json(enquiry);
});
