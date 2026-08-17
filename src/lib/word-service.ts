import type { Book, Word, WordTranslation } from "@prisma/client";
import type { TranslationService } from "@/lib/translation";
import { normalizeWord } from "@/lib/validation";

type WordWithTranslations = Word & { translations: WordTranslation[] };

export type NewWord = {
  bookId: string;
  original: string;
  normalizedOriginal: string;
  translation: string;
  translationLanguage: string;
  secondaryLanguage: string | null;
  page?: number | null;
  context?: string | null;
  translations: { targetLanguage: string; translation: string }[];
};

type WordStore = {
  findBook(id: string): Promise<Book | null>;
  findWord(bookId: string, normalizedOriginal: string): Promise<WordWithTranslations | null>;
  incrementWord(id: string, page?: number | null): Promise<WordWithTranslations>;
  createWord(data: NewWord): Promise<WordWithTranslations>;
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

  const original = input.original.trim();
  const targets = [book.targetLanguage, ...(book.secondaryLanguage && book.secondaryLanguage !== book.targetLanguage ? [book.secondaryLanguage] : [])];
  const translations = await Promise.all(targets.map(async (targetLanguage) => ({
    targetLanguage,
    translation: await translator.translate({ text: original, sourceLanguage: book.sourceLanguage, targetLanguage }),
  })));

  const word = await store.createWord({
    ...input,
    original,
    normalizedOriginal,
    translation: translations[0].translation,
    translationLanguage: book.targetLanguage,
    secondaryLanguage: translations[1]?.targetLanguage ?? null,
    translations,
  });
  return { kind: "created" as const, word };
}
