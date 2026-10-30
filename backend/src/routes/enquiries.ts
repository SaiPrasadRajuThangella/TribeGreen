import { Router } from "express";

import { requireCustomer } from "../lib/auth.js";
import { createEnquiry } from "../lib/enquiries.js";
import { enquiryLimiter } from "../lib/limits.js";
import { enquirySchema } from "../lib/validation.js";

export const enquiriesRouter = Router();

// Only signed-in customers can send an enquiry, from the website or the app
enquiriesRouter.post("/", enquiryLimiter, requireCustomer, async (req, res) => {
  const input = enquirySchema.parse(req.body);
  const enquiry = await createEnquiry(input, req.auth!.sub);
  res.status(201).json(enquiry);
});
