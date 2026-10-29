import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

// An error the client should see, with its HTTP status
export class HttpError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const badRequest = (message: string, errors?: Record<string, string>) =>
  new HttpError(400, message, errors);
export const notFound = (message = "Not found") => new HttpError(404, message);

// First message per field, e.g. { phone: "Enter a valid 10-digit mobile number" }
function zodFieldErrors(error: ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    errors[key] ??= issue.message;
  }
  return errors;
}

export const notFoundRoute: RequestHandler = (req, _res, next) =>
  next(notFound(`No route for ${req.method} ${req.path}`));

// Every error leaves as { message, errors? }, the shape the website reads
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const errors = zodFieldErrors(err);
    return res.status(400).json({ message: Object.values(errors)[0] ?? "Invalid request", errors });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body isn't valid JSON" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on our side. Try again." });
};
