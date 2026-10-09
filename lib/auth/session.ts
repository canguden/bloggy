import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db/client";
import { memberships, organizations, users } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Bloggy is a single-tenant tool for StudyCamp: there is no sign-in. The data
 * model is still keyed by organizationId, so every request resolves to one
 * fixed workspace (created on first use, idempotent).
 */
const WORKSPACE = {
  userId: "usr_studycamp",
  orgId: "org_studycamp",
  membershipId: "mem_studycamp",
  name: "StudyCamp",
  slug: "studycamp",
  email: "team@studycamp.app",
} as const;

let ensured: Promise<void> | null = null;

async function ensureWorkspace(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ id: WORKSPACE.userId, name: WORKSPACE.name, email: WORKSPACE.email, emailVerified: true })
      .onConflictDoNothing();
    await tx
      .insert(organizations)
      .values({ id: WORKSPACE.orgId, name: WORKSPACE.name, slug: WORKSPACE.slug })
      .onConflictDoNothing();
    await tx
      .insert(memberships)
      .values({
        id: WORKSPACE.membershipId,
        organizationId: WORKSPACE.orgId,
        userId: WORKSPACE.userId,
        role: "owner",
      })
      .onConflictDoNothing();
  });
}

/**
 * The one place tenant identity is resolved. Every server action and data
 * loader that touches tenant data starts here — never trust a client-supplied
 * organizationId.
 */
export async function requireOrg(): Promise<{ user: SessionUser; organizationId: string; role: string }> {
  // No cookies/headers are read any more, so without this Next would try to
  // prerender tenant pages at build time and freeze their data.
  await connection();

  // Reset on failure so a transient DB error doesn't poison the process.
  ensured ??= ensureWorkspace().catch((err) => {
    ensured = null;
    throw err;
  });
  await ensured;

  return {
    user: { id: WORKSPACE.userId, name: WORKSPACE.name, email: WORKSPACE.email },
    organizationId: WORKSPACE.orgId,
    role: "owner",
  };
}
