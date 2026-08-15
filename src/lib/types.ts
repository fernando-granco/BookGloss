export type SettingsData = {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  appearance: "system" | "light" | "dark";
};

export type BookSummary = {
  id: string;
  title: string;
  author: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  _count: { words: number };
};

export type VocabularyWord = {
  id: string;
  original: string;
  translation: string;
  translationLanguage: string;
  translations: VocabularyTranslation[];
  context: string | null;
  page: number | null;
  encounterCount: number;
  favorite: boolean;
  translationManuallyEdited: boolean;
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
