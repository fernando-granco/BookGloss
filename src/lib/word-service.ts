import type { Book, Word } from "@prisma/client";
import type { TranslationService } from "@/lib/translation";
import { normalizeWord } from "@/lib/validation";

type WordStore = {
  findBook(id: string): Promise<Book | null>;
  findWord(bookId: string, normalizedOriginal: string): Promise<Word | null>;
  incrementWord(id: string, page?: number | null): Promise<Word>;
  createWord(data: { bookId: string; original: string; normalizedOriginal: string; translation: string; page?: number | null; context?: string | null }): Promise<Word>;
};

export async function addWordToBook(
  input: { bookId: string; original: string; page?: number | null; context?: string | null },
  store: WordStore,
  translator: TranslationService,
) {
  const book = await store.findBook(input.bookId);
  if (!book) return { kind: "not-found" as const };

  const normalizedOriginal = normalizeWord(input.original);
  const existing = await store.findWord(book.id, normalizedOriginal);
  if (existing) {
    const word = await store.incrementWord(existing.id, input.page);
    return { kind: "duplicate" as const, word };
  }

  const translation = await translator.translate({
    text: input.original.trim(),
    sourceLanguage: book.sourceLanguage,
    targetLanguage: book.targetLanguage,
  });
  const word = await store.createWord({ ...input, original: input.original.trim(), normalizedOriginal, translation });
  return { kind: "created" as const, word };
}
