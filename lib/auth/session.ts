import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import { ForbiddenError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * The one place session data is read from the request. Every server action
 * and data loader that touches tenant data must start here — never trust a
 * client-supplied userId/organizationId.
 */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new ForbiddenError("You must be signed in");
  return session.user;
}

/**
 * Resolves the caller's organization membership. For this vertical slice each
 * user belongs to exactly one (personal) organization, created at signup —
 * multi-org switching is future work, but the shape already supports it.
 */
export async function requireOrg(): Promise<{ user: SessionUser; organizationId: string; role: string }> {
  const user = await requireSession();

  const [membership] = await db
    .select({ organizationId: memberships.organizationId, role: memberships.role })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!membership) throw new ForbiddenError("No workspace found for this account");

  return { user, organizationId: membership.organizationId, role: membership.role };
}
