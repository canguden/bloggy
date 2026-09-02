import "server-only";
import { z } from "zod";

/**
 * Single source of truth for server-side environment access.
 * Nothing else in the app should read `process.env` directly.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  OPENAI_API_KEY: z.string().min(1),

  SEO_PROVIDER: z.enum(["dataforseo", "mock"]).default("dataforseo"),
  DATAFORSEO_LOGIN: z.string().min(1),
  DATAFORSEO_PASSWORD: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${missing}`);
  }
  return parsed.data;
}

export const env = loadEnv();
