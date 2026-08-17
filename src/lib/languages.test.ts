import { describe, expect, it } from "vitest";
import { defaultLanguageCodes, languageOptions, languages, parseEnabledLanguages, serializeEnabledLanguages } from "@/lib/languages";

const codes = (list: readonly (readonly [string, string])[]) => list.map(([code]) => code);

describe("language options", () => {
  it("offers only the enabled languages", () => {
    expect(codes(languageOptions(["it", "de"]))).toEqual(["de", "it"]);
  });

  it("keeps a language already in use visible even when it is disabled", () => {
    expect(codes(languageOptions(["it", "de"], ["sv"]))).toEqual(["de", "it", "sv"]);
    expect(codes(languageOptions(["it", "de"], [null, undefined]))).toEqual(["de", "it"]);
  });

  it("defaults to Portuguese, English, French, and Spanish", () => {
    expect(codes(languageOptions([...defaultLanguageCodes])).sort()).toEqual(["en", "es", "fr", "pt"]);
  });

  it("can enable the whole catalog", () => {
    expect(languageOptions(languages.map(([code]) => code))).toHaveLength(languages.length);
  });
});

describe("enabled language storage", () => {
  it("round-trips through the stored string", () => {
    expect(parseEnabledLanguages(serializeEnabledLanguages(["it", "de", "it"]))).toEqual(["it", "de"]);
  });

  it("falls back to the defaults when the stored value is unusable", () => {
    for (const value of ["", null, undefined, "not-a-language", "en"]) {
      expect(parseEnabledLanguages(value)).toEqual([...defaultLanguageCodes]);
    }
  });

  it("drops unknown codes but keeps a usable selection", () => {
    expect(parseEnabledLanguages("it, de ,made-up")).toEqual(["it", "de"]);
  });
});
