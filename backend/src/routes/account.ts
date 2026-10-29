import { Router } from "express";
import type { Types } from "mongoose";

import { requireCustomer } from "../lib/auth.js";
import { HttpError } from "../lib/errors.js";
import { phoneChangeSchema, profileSchema } from "../lib/validation.js";
import { Enquiry } from "../models/Enquiry.js";
import { User } from "../models/User.js";

async function currentUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw new HttpError(401, "Please sign in again");
  return user;
}

/* ---------- /api/me: the signed-in customer's profile ---------- */

export const meRouter = Router();
meRouter.use(requireCustomer);

meRouter.get("/", async (req, res) => {
  res.json(await currentUser(req.auth!.sub));
});

meRouter.patch("/", async (req, res) => {
  const profile = profileSchema.parse(req.body);
  const user = await currentUser(req.auth!.sub);
  user.set(profile);
  await user.save();
  res.json(user);
});

/* ---------- /api/my/enquiries: their enquiries and orders ---------- */

export const myRouter = Router();
myRouter.use(requireCustomer);

// Made while signed in, or with this verified number (e.g. from the app)
const ownedBy = (user: { _id: Types.ObjectId; phone: string }) => ({
  $or: [{ user: user._id }, { phone: user.phone }],
});

myRouter.get("/enquiries", async (req, res) => {
  const user = await currentUser(req.auth!.sub);
  res.json(await Enquiry.find(ownedBy(user)).sort({ createdAt: -1 }));
});

myRouter.get("/enquiries/:id", async (req, res) => {
  const user = await currentUser(req.auth!.sub);
  const enquiry = await Enquiry.findOne({ ref: req.params.id, ...ownedBy(user) });
  if (!enquiry) throw new HttpError(404, "We couldn't find that order on your account");
  res.json(enquiry);
});

// The number the team should call back on
myRouter.patch("/enquiries/:id/phone", async (req, res) => {
  const { phone } = phoneChangeSchema.parse(req.body);
  const user = await currentUser(req.auth!.sub);
  const enquiry = await Enquiry.findOne({ ref: req.params.id, ...ownedBy(user) });
  if (!enquiry) throw new HttpError(404, "We couldn't find that order on your account");
  if (enquiry.status === "Lost" || enquiry.order?.stage === "Delivered") {
    throw new HttpError(409, "This enquiry is closed");
  }
  enquiry.phone = phone;
  enquiry.user = user._id; // keeps it on this account even though the number changed
  await enquiry.save();
  res.json(enquiry);
});
