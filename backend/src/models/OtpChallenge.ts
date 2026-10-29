import { model, Schema } from "mongoose";

// A pending sign-in code. MongoDB deletes it by itself once it expires.
const otpSchema = new Schema({
  phone: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const OtpChallenge = model("OtpChallenge", otpSchema);
