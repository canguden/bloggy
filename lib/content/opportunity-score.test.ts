import { describe, expect, it } from "vitest";
import {
  scoreOpportunity,
  searchDemandFromVolume,
  competitionScoreFromRaw,
  commercialIntentScore,
  contentGapScore,
  businessRelevanceScore,
} from "./opportunity-score";

describe("scoreOpportunity", () => {
  it("is deterministic and pure — same input always yields the same output", () => {
    const components = {
      searchDemand: 80,
      competition: 60,
      businessRelevance: 90,
      commercialIntent: 100,
      contentGap: 100,
    };
    expect(scoreOpportunity(components)).toEqual(scoreOpportunity(components));
  });

  it("weights business relevance highest among the components", () => {
    const base = { searchDemand: 50, competition: 50, businessRelevance: 50, commercialIntent: 50, contentGap: 50 };
    const relevanceBoost = scoreOpportunity({ ...base, businessRelevance: 100 }).score;
    const demandBoost = scoreOpportunity({ ...base, searchDemand: 100 }).score;
    expect(relevanceBoost).toBeGreaterThan(demandBoost);
  });

  it("clamps out-of-range inputs instead of producing an invalid score", () => {
    const result = scoreOpportunity({
      searchDemand: 500,
      competition: -50,
      businessRelevance: 100,
      commercialIntent: 100,
      contentGap: 100,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.competition).toBe(0);
  });

  it("returns an integer score", () => {
    const result = scoreOpportunity({
      searchDemand: 33,
      competition: 47,
      businessRelevance: 61,
      commercialIntent: 80,
      contentGap: 100,
    });
    expect(Number.isInteger(result.score)).toBe(true);
  });
});

describe("searchDemandFromVolume", () => {
  it("treats null/zero volume as near-zero demand, not a crash", () => {
    expect(searchDemandFromVolume(null)).toBe(5);
    expect(searchDemandFromVolume(0)).toBe(5);
  });

  it("increases monotonically with volume", () => {
    expect(searchDemandFromVolume(100)).toBeLessThan(searchDemandFromVolume(10_000));
  });

  it("caps at 100 for very high volume", () => {
    expect(searchDemandFromVolume(10_000_000)).toBeLessThanOrEqual(100);
  });
});

describe("competitionScoreFromRaw", () => {
  it("inverts raw competition — low competition is a high score", () => {
    expect(competitionScoreFromRaw(0.1)).toBeGreaterThan(competitionScoreFromRaw(0.9));
  });

  it("treats unknown competition as medium, not zero", () => {
    expect(competitionScoreFromRaw(null)).toBe(50);
  });
});

describe("commercialIntentScore", () => {
  it("ranks transactional above informational", () => {
    expect(commercialIntentScore("transactional")).toBeGreaterThan(commercialIntentScore("informational"));
  });

  it("falls back to informational when intent is unknown", () => {
    expect(commercialIntentScore(null)).toBe(commercialIntentScore("informational"));
  });
});

describe("contentGapScore", () => {
  const pages = [{ title: "Best CRM software", summary: "A guide to CRM tools for small teams" }];

  it("scores low when an existing page already covers the keyword", () => {
    expect(contentGapScore("best crm software", pages)).toBeLessThan(50);
  });

  it("scores high when nothing covers the keyword", () => {
    expect(contentGapScore("payroll compliance checklist", pages)).toBeGreaterThan(50);
  });
});

describe("businessRelevanceScore", () => {
  it("scores higher when the keyword shares vocabulary with the business", () => {
    const vocabulary = ["invoicing", "small business", "accounting software"];
    const relevant = businessRelevanceScore("invoicing software for small business", vocabulary);
    const irrelevant = businessRelevanceScore("best hiking boots 2026", vocabulary);
    expect(relevant).toBeGreaterThan(irrelevant);
  });
});
