import type { Book, Word, WordTranslation } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { addWordToBook } from "@/lib/word-service";

const now = new Date("2026-08-18T12:00:00Z");
const book: Book = { id: "book-1", title: "L'Étranger", author: "Albert Camus", sourceLanguage: "fr", targetLanguage: "en", secondaryLanguage: null, createdAt: now, updatedAt: now };
const existing: Word = { id: "word-1", bookId: book.id, original: "Accablé", normalizedOriginal: "accablé", translation: "my own wording", translationLanguage: "en", secondaryLanguage: null, context: null, page: null, encounterCount: 1, favorite: false, createdAt: now, updatedAt: now, lastEncounteredAt: now };
const translation: WordTranslation = { id: "t-1", wordId: existing.id, targetLanguage: "en", translation: existing.translation, manuallyEdited: true, createdAt: now, updatedAt: now };
const existingWithTranslations = { ...existing, translations: [translation] };

const storeFor = (overrides: Partial<Record<string, unknown>> = {}) => ({
  findBook: vi.fn().mockResolvedValue(book),
  findWord: vi.fn().mockResolvedValue(null),
  incrementWord: vi.fn(),
  createWord: vi.fn(async (data: unknown) => ({ ...existingWithTranslations, ...(data as object) })),
  ...overrides,
});

describe("addWordToBook", () => {
  it("increments a normalized duplicate without translating or overwriting a manual translation", async () => {
    const translate = vi.fn();
    const incremented = { ...existingWithTranslations, encounterCount: 2, page: 41 };
    const store = storeFor({ findWord: vi.fn().mockResolvedValue(existingWithTranslations), incrementWord: vi.fn().mockResolvedValue(incremented) });
    const result = await addWordToBook({ bookId: book.id, original: "  accablé ", page: 41 }, store, { translate });
    expect(result).toEqual({ kind: "duplicate", word: incremented });
    expect(store.findWord).toHaveBeenCalledWith(book.id, "accablé");
    expect(translate).not.toHaveBeenCalled();
  });

  it("reports a missing book without translating", async () => {
    const translate = vi.fn();
    const store = storeFor({ findBook: vi.fn().mockResolvedValue(null) });
    expect(await addWordToBook({ bookId: "gone", original: "x" }, store, { translate })).toEqual({ kind: "not-found" });
    expect(translate).not.toHaveBeenCalled();
  });

  it("translates a new word into the book's single target language", async () => {
    const store = storeFor();
    const translate = vi.fn().mockResolvedValue("overwhelmed");
    const result = await addWordToBook({ bookId: book.id, original: " Accablé " }, store, { translate });
    expect(result.kind).toBe("created");
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate).toHaveBeenCalledWith({ text: "Accablé", sourceLanguage: "fr", targetLanguage: "en" });
    expect(store.createWord).toHaveBeenCalledWith(expect.objectContaining({
      normalizedOriginal: "accablé", translation: "overwhelmed", translationLanguage: "en", secondaryLanguage: null,
      translations: [{ targetLanguage: "en", translation: "overwhelmed" }],
    }));
  });

  it("translates into both languages when the book has a second one", async () => {
    const store = storeFor({ findBook: vi.fn().mockResolvedValue({ ...book, secondaryLanguage: "pt" }) });
    const translate = vi.fn(async ({ targetLanguage }: { targetLanguage: string }) => `${targetLanguage}-word`);
    await addWordToBook({ bookId: book.id, original: "accablé" }, store, { translate });
    expect(translate).toHaveBeenCalledTimes(2);
    expect(store.createWord).toHaveBeenCalledWith(expect.objectContaining({
      translation: "en-word", translationLanguage: "en", secondaryLanguage: "pt",
      translations: [{ targetLanguage: "en", translation: "en-word" }, { targetLanguage: "pt", translation: "pt-word" }],
    }));
  });

  it("ignores a second language that repeats the first one", async () => {
    const store = storeFor({ findBook: vi.fn().mockResolvedValue({ ...book, secondaryLanguage: "en" }) });
    const translate = vi.fn().mockResolvedValue("overwhelmed");
    await addWordToBook({ bookId: book.id, original: "accablé" }, store, { translate });
    expect(translate).toHaveBeenCalledTimes(1);
    expect(store.createWord).toHaveBeenCalledWith(expect.objectContaining({ secondaryLanguage: null }));
  });
});
