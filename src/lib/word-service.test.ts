import type { Book, Word } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { addWordToBook } from "@/lib/word-service";

const now = new Date("2026-08-15T12:00:00Z");
const book: Book = { id: "book-1", title: "Dorian Gray", author: "Oscar Wilde", sourceLanguage: "en", targetLanguage: "pt", createdAt: now, updatedAt: now };
const existing: Word = { id: "word-1", bookId: book.id, original: "Oeuvre", normalizedOriginal: "oeuvre", translation: "obra editada", context: null, page: null, encounterCount: 1, favorite: false, translationManuallyEdited: true, createdAt: now, updatedAt: now, lastEncounteredAt: now };

describe("addWordToBook", () => {
  it("increments a normalized duplicate without translating or overwriting a manual translation", async () => {
    const translate = vi.fn();
    const incremented = { ...existing, encounterCount: 2, page: 41 };
    const store = {
      findBook: vi.fn().mockResolvedValue(book), findWord: vi.fn().mockResolvedValue(existing),
      incrementWord: vi.fn().mockResolvedValue(incremented), createWord: vi.fn(),
    };
    const result = await addWordToBook({ bookId: book.id, original: "  oeuvre ", page: 41 }, store, { translate });
    expect(result).toEqual({ kind: "duplicate", word: incremented });
    if (result.kind !== "duplicate") throw new Error("Expected a duplicate result");
    expect(store.findWord).toHaveBeenCalledWith(book.id, "oeuvre");
    expect(translate).not.toHaveBeenCalled();
    expect(result.word.translation).toBe("obra editada");
  });

  it("translates and saves a new normalized word", async () => {
    const created = { ...existing, id: "word-2", original: "languid", normalizedOriginal: "languid", translation: "lânguido", translationManuallyEdited: false };
    const store = {
      findBook: vi.fn().mockResolvedValue(book), findWord: vi.fn().mockResolvedValue(null),
      incrementWord: vi.fn(), createWord: vi.fn().mockResolvedValue(created),
    };
    const translate = vi.fn().mockResolvedValue("lânguido");
    const result = await addWordToBook({ bookId: book.id, original: " Languid " }, store, { translate });
    expect(result.kind).toBe("created");
    expect(translate).toHaveBeenCalledWith({ text: "Languid", sourceLanguage: "en", targetLanguage: "pt" });
    expect(store.createWord).toHaveBeenCalledWith(expect.objectContaining({ normalizedOriginal: "languid", translation: "lânguido" }));
  });
});
