/**
 * Runs before every test file. Points the app's DB singleton at the
 * dedicated `bloggy_test` database and fills in dummy values for the env
 * vars lib/config/env.ts requires but integration tests never actually call
 * out to (OpenAI, DataForSEO, Better Auth) — set only if not already present,
 * so a real .env.local is never overridden.
 */
const defaults: Record<string, string> = {
  DATABASE_URL: "postgresql://localhost:5432/bloggy_test",
  BETTER_AUTH_SECRET: "test-secret-not-for-production",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  OPENAI_API_KEY: "test-openai-key",
  DATAFORSEO_LOGIN: "test-login",
  DATAFORSEO_PASSWORD: "test-password",
  SEO_PROVIDER: "dataforseo",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
