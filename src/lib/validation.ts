import { z } from "zod";
import { languageCodes } from "@/lib/languages";

const language = z.string().refine((value) => languageCodes.has(value), "Choose a supported language");
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: optionalText(200),
  sourceLanguage: language,
  targetLanguage: language,
}).refine((book) => book.sourceLanguage !== book.targetLanguage, {
  message: "Source and target languages must be different",
  path: ["targetLanguage"],
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
});

export const settingsSchema = z.object({
  defaultSourceLanguage: language,
  defaultTargetLanguage: language,
  appearance: z.enum(["system", "light", "dark"]),
}).refine((settings) => settings.defaultSourceLanguage !== settings.defaultTargetLanguage, {
  message: "Default languages must be different",
  path: ["defaultTargetLanguage"],
});

export function normalizeWord(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}
