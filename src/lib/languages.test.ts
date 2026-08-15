import { describe, expect, it } from "vitest";
import { languageOptions, languages } from "@/lib/languages";

describe("language options", () => {
  it("shows the four focused languages by default", () => {
    expect(languageOptions(false).map(([code]) => code)).toEqual(["pt", "fr", "en", "es"]);
  });

  it("keeps an existing uncommon selection visible", () => {
    expect(languageOptions(false, ["de"]).map(([code]) => code)).toEqual(["pt", "fr", "en", "es", "de"]);
  });

  it("returns the full catalog when expanded", () => {
    expect(languageOptions(true)).toBe(languages);
  });
});
