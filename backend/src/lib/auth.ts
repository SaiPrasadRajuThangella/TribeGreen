import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { config } from "../config.js";

import { HttpError } from "./errors.js";

type Role = "admin" | "customer";
type Claims = { sub: string; role: Role };

declare module "express-serve-static-core" {
  interface Request {
    auth?: Claims;
  }
}

const EXPIRY: Record<Role, jwt.SignOptions["expiresIn"]> = {
  admin: "12h",
  customer: "30d",
};

export const signToken = (sub: string, role: Role) =>
  jwt.sign({ role }, config.JWT_SECRET, { subject: sub, expiresIn: EXPIRY[role] });

function readToken(header: string | undefined): Claims | null {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub || (payload.role !== "admin" && payload.role !== "customer")) return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// 401 when not signed in (or the session ran out), 403 when signed in with the wrong role
const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    const claims = readToken(req.headers.authorization);
    if (!claims) return next(new HttpError(401, "Please sign in again"));
    if (claims.role !== role) return next(new HttpError(403, "Not allowed"));
    req.auth = claims;
    next();
  };

export const requireAdmin = requireRole("admin");
export const requireCustomer = requireRole("customer");

// For routes open to everyone that link the work to a customer when they are signed in
export const optionalCustomer: RequestHandler = (req, _res, next) => {
  const claims = readToken(req.headers.authorization);
  if (claims?.role === "customer") req.auth = claims;
  next();
};
