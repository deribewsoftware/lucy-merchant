import { describe, expect, it } from "vitest";
import { matchesQuery, parseAdvancedQuery } from "./catalog-search";

describe("matchesQuery", () => {
  it("matches if any OR alternative matches the haystack", () => {
    expect(matchesQuery("hello world", "hello OR goodbye")).toBe(true);
    expect(matchesQuery("goodbye moon", "hello OR goodbye")).toBe(true);
    expect(matchesQuery("nope", "hello OR goodbye")).toBe(false);
  });

  it("matches quoted phrase as substring", () => {
    expect(matchesQuery("x pipe fitting y", '"pipe fitting"')).toBe(true);
    expect(matchesQuery("pipe", '"pipe fitting"')).toBe(false);
  });

  it("treats hyphenated terms as AND of parts (same as space-separated)", () => {
    expect(matchesQuery("stock steel rebar grade", "steel-rebar")).toBe(true);
    expect(matchesQuery("steel beam structural", "steel-rebar")).toBe(false);
  });

  it("matches singular/plural variants for common nouns", () => {
    expect(matchesQuery("blue jean pants wholesale", "jeans")).toBe(true);
  });
});

describe("parseAdvancedQuery", () => {
  it("parses simple AND tokens as one alternative", () => {
    const alts = parseAdvancedQuery("red wine");
    expect(alts).toHaveLength(1);
    expect(alts[0].phrases).toEqual([]);
    expect(alts[0].tokens).toContain("red");
    expect(alts[0].tokens).toContain("wine");
  });

  it("extracts quoted phrases", () => {
    const alts = parseAdvancedQuery('"pipe fitting" steel');
    expect(alts).toHaveLength(1);
    expect(alts[0].phrases).toEqual(["pipe fitting"]);
    expect(alts[0].tokens).toContain("steel");
  });

  it("splits OR branches", () => {
    const alts = parseAdvancedQuery("denim OR cotton");
    expect(alts).toHaveLength(2);
    expect(alts[0].tokens).toContain("denim");
    expect(alts[1].tokens).toContain("cotton");
  });

  it("splits on pipe", () => {
    const alts = parseAdvancedQuery("a | b");
    expect(alts).toHaveLength(2);
    expect(alts[0].tokens).toEqual(["a"]);
    expect(alts[1].tokens).toEqual(["b"]);
  });

  it("does not split OR inside quotes", () => {
    const alts = parseAdvancedQuery('"a OR b"');
    expect(alts).toHaveLength(1);
    expect(alts[0].phrases).toEqual(["a OR b"]);
    expect(alts[0].tokens).toEqual([]);
  });

  it("returns empty for blank or only noise", () => {
    expect(parseAdvancedQuery("")).toEqual([]);
    expect(parseAdvancedQuery("   ")).toEqual([]);
  });

  it("splits compound tokens on hyphens in the unquoted part", () => {
    const alts = parseAdvancedQuery("steel-rebar");
    expect(alts[0].tokens).toContain("steel");
    expect(alts[0].tokens).toContain("rebar");
  });
});
