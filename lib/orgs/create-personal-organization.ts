import "server-only";
import { db } from "@/lib/db/client";
import { organizations, memberships } from "@/lib/db/schema";
import { createId } from "@/lib/ids";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return base || "workspace";
}

/** Called once from a Better Auth user-creation hook. Idempotent-ish: a user only ever goes through signup once. */
export async function createPersonalOrganization(userId: string, displayName: string) {
  const slug = `${slugify(displayName)}-${createId("").slice(1, 7)}`;

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ id: createId("org"), name: `${displayName}'s workspace`, slug })
      .returning();

    await tx.insert(memberships).values({
      id: createId("mem"),
      organizationId: org.id,
      userId,
      role: "owner",
    });
  });
}
