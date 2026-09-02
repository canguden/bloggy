import { randomUUID } from "crypto";

/** Prefixed ids (e.g. "org_...", "web_...") make ids self-describing in logs and URLs. */
export function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}
