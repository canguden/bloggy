import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { users, sessions, accounts, verifications } from "@/lib/db/schema";
import { env } from "@/lib/config/env";
import { createPersonalOrganization } from "@/lib/orgs/create-personal-organization";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day of activity
  },
  databaseHooks: {
    user: {
      create: {
        // Every new user gets a personal organization + owner membership in
        // one transaction — they should never land in an org-less state.
        after: async (user) => {
          await createPersonalOrganization(user.id, user.name || user.email);
        },
      },
    },
  },
});
