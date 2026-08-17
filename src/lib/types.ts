export type SettingsData = {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  enabledLanguages: string[];
  appearance: "system" | "light" | "dark";
};

export type BookSummary = {
  id: string;
  title: string;
  author: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  secondaryLanguage: string | null;
  _count: { words: number };
};

export type VocabularyWord = {
  id: string;
  original: string;
  translation: string;
  translationLanguage: string;
  secondaryLanguage: string | null;
  translations: VocabularyTranslation[];
  context: string | null;
  page: number | null;
  encounterCount: number;
  favorite: boolean;
  createdAt: string;
  lastEncounteredAt: string;
};

export type VocabularyTranslation = {
  id: string;
  targetLanguage: string;
  translation: string;
  manuallyEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookDetail = BookSummary & { words: VocabularyWord[] };

/** The translation shown under the primary one, when the word has a second language set. */
export const secondaryTranslation = (word: VocabularyWord) =>
  word.secondaryLanguage ? word.translations.find((item) => item.targetLanguage === word.secondaryLanguage) ?? null : null;
