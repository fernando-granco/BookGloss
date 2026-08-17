import { describe, expect, it } from "vitest";
import { addWordSchema, bookSchema, normalizeWord, settingsSchema, updateWordSchema } from "@/lib/validation";

const book = { title: "Book", sourceLanguage: "fr", targetLanguage: "en" };
const settings = { defaultSourceLanguage: "fr", defaultTargetLanguage: "en", enabledLanguages: ["fr", "en"], appearance: "system" };

describe("word normalization and validation", () => {
  it("normalizes whitespace, Unicode, and casing", () => {
    expect(normalizeWord("  Oeuvre  ")).toBe("oeuvre");
    expect(normalizeWord("ＣＡＦÉ")).toBe("café");
  });

  it("rejects invalid page numbers and empty words", () => {
    expect(() => addWordSchema.parse({ original: "", page: 0 })).toThrow();
    expect(addWordSchema.parse({ original: " oeuvre ", page: 37 }).original).toBe("oeuvre");
  });

  it("accepts supported alternate translation languages", () => {
    expect(updateWordSchema.parse({ translateToLanguage: "pt" }).translateToLanguage).toBe("pt");
    expect(() => updateWordSchema.parse({ translateToLanguage: "not-a-language" })).toThrow();
  });

  it("lets the second displayed translation be cleared", () => {
    expect(updateWordSchema.parse({ selectSecondaryLanguage: null }).selectSecondaryLanguage).toBeNull();
    expect(updateWordSchema.parse({}).selectSecondaryLanguage).toBeUndefined();
  });
});

describe("book validation", () => {
  it("rejects a missing title or an unsupported language", () => {
    expect(() => bookSchema.parse({ ...book, title: "" })).toThrow();
    expect(() => bookSchema.parse({ ...book, sourceLanguage: "made-up" })).toThrow();
  });

  it("requires the source and first translation to differ", () => {
    expect(() => bookSchema.parse({ ...book, targetLanguage: "fr" })).toThrow();
  });

  it("accepts an optional second translation language", () => {
    expect(bookSchema.parse({ ...book, secondaryLanguage: "pt" }).secondaryLanguage).toBe("pt");
    expect(bookSchema.parse({ ...book, secondaryLanguage: null }).secondaryLanguage).toBeNull();
  });

  it("rejects a second language that duplicates the source or the first translation", () => {
    expect(() => bookSchema.parse({ ...book, secondaryLanguage: "fr" })).toThrow();
    expect(() => bookSchema.parse({ ...book, secondaryLanguage: "en" })).toThrow();
  });
});

describe("settings validation", () => {
  it("accepts an arbitrary enabled selection", () => {
    const parsed = settingsSchema.parse({ ...settings, defaultSourceLanguage: "it", defaultTargetLanguage: "de", enabledLanguages: ["it", "de"] });
    expect(parsed.enabledLanguages).toEqual(["it", "de"]);
  });

  it("requires at least two enabled languages", () => {
    expect(() => settingsSchema.parse({ ...settings, enabledLanguages: ["fr"] })).toThrow();
  });

  it("requires the defaults to stay enabled", () => {
    expect(() => settingsSchema.parse({ ...settings, enabledLanguages: ["it", "de"] })).toThrow();
  });

  it("rejects identical default languages", () => {
    expect(() => settingsSchema.parse({ ...settings, defaultTargetLanguage: "fr" })).toThrow();
  });
});
