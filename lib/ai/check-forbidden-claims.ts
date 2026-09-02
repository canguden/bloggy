/**
 * Post-generation guard: forbidden claims from the Business Context are a
 * hard constraint, not a suggestion left to the prompt alone. A simple
 * substring check catches the common case of the model repeating a claim
 * verbatim; it is not a substitute for the prompt instruction, just a floor.
 */
export function findForbiddenClaimViolations(body: string, forbiddenClaims: string[]): string[] {
  const lowerBody = body.toLowerCase();
  return forbiddenClaims.filter((claim) => claim.trim().length > 0 && lowerBody.includes(claim.toLowerCase()));
}
