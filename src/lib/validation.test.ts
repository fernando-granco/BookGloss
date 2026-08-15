import { describe, expect, it } from "vitest";
import { addWordSchema, bookSchema, normalizeWord, settingsSchema, updateWordSchema } from "@/lib/validation";

describe("word normalization and validation", () => {
  it("normalizes whitespace, Unicode, and casing", () => {
    expect(normalizeWord("  Oeuvre  ")).toBe("oeuvre");
    expect(normalizeWord("ＣＡＦÉ")).toBe("café");
  });

  it("rejects invalid books", () => {
    expect(() => bookSchema.parse({ title: "", author: "", sourceLanguage: "en", targetLanguage: "en" })).toThrow();
    expect(() => bookSchema.parse({ title: "Book", sourceLanguage: "made-up", targetLanguage: "pt" })).toThrow();
  });

  it("rejects invalid page numbers and empty words", () => {
    expect(() => addWordSchema.parse({ original: "", page: 0 })).toThrow();
    expect(addWordSchema.parse({ original: " oeuvre ", page: 37 }).original).toBe("oeuvre");
  });

  it("accepts supported alternate translation languages", () => {
    expect(updateWordSchema.parse({ translateToLanguage: "pt" }).translateToLanguage).toBe("pt");
    expect(() => updateWordSchema.parse({ translateToLanguage: "not-a-language" })).toThrow();
  });

  it("keeps the compact language list as the settings default", () => {
    const settings = settingsSchema.parse({ defaultSourceLanguage: "fr", defaultTargetLanguage: "en", appearance: "system" });
    expect(settings.showAllLanguages).toBe(false);
  });
});
