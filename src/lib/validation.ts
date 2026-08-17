import { z } from "zod";
import { languageCodes, minimumEnabledLanguages } from "@/lib/languages";

const language = z.string().refine((value) => languageCodes.has(value), "Choose a supported language");
const optionalLanguage = language.nullable().optional();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: optionalText(200),
  sourceLanguage: language,
  targetLanguage: language,
  secondaryLanguage: optionalLanguage,
}).refine((book) => book.sourceLanguage !== book.targetLanguage, {
  message: "Source and target languages must be different",
  path: ["targetLanguage"],
}).refine((book) => !book.secondaryLanguage || (book.secondaryLanguage !== book.sourceLanguage && book.secondaryLanguage !== book.targetLanguage), {
  message: "The second language must differ from the source and the first translation",
  path: ["secondaryLanguage"],
});

export const addWordSchema = z.object({
  original: z.string().trim().min(1, "Enter a word").max(200),
  page: z.number().int().positive().max(100000).optional().nullable(),
  context: optionalText(2000),
});

export const updateWordSchema = z.object({
  original: z.string().trim().min(1).max(200).optional(),
  translation: z.string().trim().min(1).max(500).optional(),
  page: z.number().int().positive().max(100000).optional().nullable(),
  context: optionalText(2000),
  favorite: z.boolean().optional(),
  retranslate: z.boolean().optional(),
  translateToLanguage: language.optional(),
  selectTranslationLanguage: language.optional(),
  // null clears the second translation shown in the vocabulary list.
  selectSecondaryLanguage: optionalLanguage,
});

export const settingsSchema = z.object({
  defaultSourceLanguage: language,
  defaultTargetLanguage: language,
  enabledLanguages: z.array(language).min(minimumEnabledLanguages, "Enable at least two languages").max(languageCodes.size),
  appearance: z.enum(["system", "light", "dark"]),
}).refine((settings) => settings.defaultSourceLanguage !== settings.defaultTargetLanguage, {
  message: "Default languages must be different",
  path: ["defaultTargetLanguage"],
}).refine((settings) => [settings.defaultSourceLanguage, settings.defaultTargetLanguage].every((code) => settings.enabledLanguages.includes(code)), {
  message: "Keep the default languages enabled",
  path: ["enabledLanguages"],
});

export function normalizeWord(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}
