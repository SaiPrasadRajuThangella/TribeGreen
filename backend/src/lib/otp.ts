import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { config } from "../config.js";
import { OtpChallenge } from "../models/OtpChallenge.js";

import { HttpError } from "./errors.js";

const TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

// Codes are stored hashed, never as plain digits
const hash = (phone: string, code: string) =>
  createHmac("sha256", config.JWT_SECRET).update(`${phone}:${code}`).digest("hex");

/*
 * No SMS provider is connected yet:
 *   fixed   → every number gets FIXED_OTP (the demo code)
 *   console → a random code, printed in the server log
 * Sending a real SMS later only means replacing deliver().
 */
function deliver(phone: string, code: string) {
  if (config.OTP_MODE === "console") console.log(`Sign-in code for ${phone}: ${code}`);
}

export async function startChallenge(phone: string) {
  const code = config.OTP_MODE === "fixed" ? config.FIXED_OTP : String(randomInt(100000, 1000000));
  await OtpChallenge.deleteMany({ phone });
  await OtpChallenge.create({
    phone,
    codeHash: hash(phone, code),
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60000),
  });
  deliver(phone, code);
  return { expiresInSeconds: TTL_MINUTES * 60 };
}

export async function checkChallenge(phone: string, code: string) {
  const challenge = await OtpChallenge.findOne({ phone }).sort({ expiresAt: -1 });
  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "That code has expired. Ask for a new one.");
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await challenge.deleteOne();
    throw new HttpError(429, "Too many wrong codes. Ask for a new one.");
  }
  const expected = Buffer.from(challenge.codeHash, "hex");
  const given = Buffer.from(hash(phone, code), "hex");
  if (!timingSafeEqual(expected, given)) {
    challenge.attempts += 1;
    await challenge.save();
    throw new HttpError(400, "That code isn't right. Check it and try again.");
  }
  await challenge.deleteOne();
}
