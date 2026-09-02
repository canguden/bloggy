import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { organizations, websites } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { NotFoundError } from "@/lib/errors";
import { getWebsiteForOrg, listWebsitesForOrg } from "./website-queries";

/**
 * Runs against a dedicated `bloggy_test` database (see test/setup-env.ts).
 * This is the specific thing the plan calls out as most important to verify:
 * one organization can never read another organization's resources, even
 * when it has a valid, well-formed resource id to try.
 */
describe("website tenant isolation", () => {
  const orgA = createId("org");
  const orgB = createId("org");
  let websiteInOrgA: string;

  beforeAll(async () => {
    await db.insert(organizations).values([
      { id: orgA, name: "Org A", slug: `org-a-${orgA}` },
      { id: orgB, name: "Org B", slug: `org-b-${orgB}` },
    ]);

    websiteInOrgA = createId("web");
    await db.insert(websites).values({
      id: websiteInOrgA,
      organizationId: orgA,
      url: "https://example.com",
      domain: "example.com",
    });
  });

  afterAll(async () => {
    await db.delete(websites).where(eq(websites.organizationId, orgA));
    await db.delete(organizations).where(eq(organizations.id, orgA));
    await db.delete(organizations).where(eq(organizations.id, orgB));
  });

  it("lets an organization read its own website", async () => {
    const website = await getWebsiteForOrg(orgA, websiteInOrgA);
    expect(website.id).toBe(websiteInOrgA);
  });

  it("throws NotFoundError when a different organization requests the same website id", async () => {
    await expect(getWebsiteForOrg(orgB, websiteInOrgA)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("never lists another organization's websites", async () => {
    const orgBWebsites = await listWebsitesForOrg(orgB);
    expect(orgBWebsites.find((w) => w.id === websiteInOrgA)).toBeUndefined();
  });
});
