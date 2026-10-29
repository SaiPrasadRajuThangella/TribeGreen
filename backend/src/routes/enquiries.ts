import { Router } from "express";

import { optionalCustomer } from "../lib/auth.js";
import { createEnquiry } from "../lib/enquiries.js";
import { enquiryLimiter } from "../lib/limits.js";
import { enquirySchema } from "../lib/validation.js";

export const enquiriesRouter = Router();

// The website sends enquiries signed in; the Android app doesn't have accounts yet
enquiriesRouter.post("/", enquiryLimiter, optionalCustomer, async (req, res) => {
  const input = enquirySchema.parse(req.body);
  const enquiry = await createEnquiry(input, req.auth?.sub);
  res.status(201).json(enquiry);
});
