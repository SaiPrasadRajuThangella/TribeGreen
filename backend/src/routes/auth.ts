import { Router } from "express";

import { config } from "../config.js";
import { signToken } from "../lib/auth.js";
import { otpLimiter } from "../lib/limits.js";
import { checkChallenge, startChallenge } from "../lib/otp.js";
import { otpRequestSchema, otpVerifySchema } from "../lib/validation.js";
import { User } from "../models/User.js";

/*
 * Customer sign-in with the mobile number. The same two steps sign up a new customer:
 * verifying a number that has no account creates one, and the profile is filled in after.
 */
export const authRouter = Router();

authRouter.post("/otp", otpLimiter, async (req, res) => {
  const { phone } = otpRequestSchema.parse(req.body);
  const { expiresInSeconds } = await startChallenge(phone);
  res.json({
    sent: true,
    expiresInSeconds,
    // Demo mode only, until an SMS provider is connected
    ...(config.OTP_MODE === "fixed" ? { demoCode: config.FIXED_OTP } : {}),
  });
});

authRouter.post("/verify", otpLimiter, async (req, res) => {
  const { phone, code } = otpVerifySchema.parse(req.body);
  await checkChallenge(phone, code);
  const user = await User.findOneAndUpdate(
    { phone },
    { $set: { lastLoginAt: new Date() }, $setOnInsert: { phone } },
    { upsert: true, returnDocument: "after" },
  );
  res.json({ token: signToken(String(user._id), "customer"), user });
});
