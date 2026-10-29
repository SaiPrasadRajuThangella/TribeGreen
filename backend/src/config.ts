import { z } from "zod";

// Read backend/.env when it exists (Render and other hosts set real environment variables)
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the environment
}

const isProduction = process.env.NODE_ENV === "production";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default(""),
  JWT_SECRET: isProduction
    ? z.string().min(32, "JWT_SECRET must be at least 32 characters in production")
    : z.string().default("dev-only-secret-change-me-dev-only-secret"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:4173"),
  ADMIN_USERNAME: z.string().min(3).default("admin"),
  // The demo password only applies locally; a live server must set its own
  ADMIN_PASSWORD: isProduction ? z.string().min(8) : z.string().min(8).default("tribegreen"),
  OTP_MODE: z.enum(["fixed", "console"]).default("fixed"),
  FIXED_OTP: z
    .string()
    .regex(/^\d{6}$/, "FIXED_OTP must be 6 digits")
    .default("123456"),
  REPLY_WITHIN_HOURS: z.coerce.number().positive().default(2),
  SEED_SAMPLES: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProduction,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
