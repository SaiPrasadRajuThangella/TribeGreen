import { randomInt } from "node:crypto";

// No 0/O or 1/I, so references are easy to read out over the phone
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const randomCode = (length: number) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

// "TG-8K2QXA"
export const newEnquiryRef = () => `TG-${randomCode(6)}`;

// "TGT-261029-4821": the day the order was confirmed plus four random digits
export const newTrackingNumber = (at = new Date()) =>
  `TGT-${at.toISOString().slice(2, 10).replace(/-/g, "")}-${randomInt(1000, 10000)}`;

// Today as yyyy-mm-dd in India, where the team works
export const todayInIndia = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
