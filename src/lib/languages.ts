export type Language = readonly [code: string, name: string];

export const languages: readonly Language[] = [
  ["af", "Afrikaans"], ["sq", "Albanian"], ["am", "Amharic"], ["ar", "Arabic"],
  ["hy", "Armenian"], ["az", "Azerbaijani"], ["eu", "Basque"], ["be", "Belarusian"],
  ["bn", "Bengali"], ["bs", "Bosnian"], ["bg", "Bulgarian"], ["ca", "Catalan"],
  ["zh", "Chinese"], ["hr", "Croatian"], ["cs", "Czech"], ["da", "Danish"],
  ["nl", "Dutch"], ["en", "English"], ["et", "Estonian"], ["fi", "Finnish"],
  ["fr", "French"], ["gl", "Galician"], ["ka", "Georgian"], ["de", "German"],
  ["el", "Greek"], ["gu", "Gujarati"], ["he", "Hebrew"], ["hi", "Hindi"],
  ["hu", "Hungarian"], ["is", "Icelandic"], ["id", "Indonesian"], ["ga", "Irish"],
  ["it", "Italian"], ["ja", "Japanese"], ["kn", "Kannada"], ["ko", "Korean"],
  ["lv", "Latvian"], ["lt", "Lithuanian"], ["mk", "Macedonian"], ["ms", "Malay"],
  ["mt", "Maltese"], ["no", "Norwegian"], ["fa", "Persian"], ["pl", "Polish"],
  ["pt", "Portuguese"], ["pa", "Punjabi"], ["ro", "Romanian"], ["ru", "Russian"],
  ["sr", "Serbian"], ["sk", "Slovak"], ["sl", "Slovenian"], ["es", "Spanish"],
  ["sw", "Swahili"], ["sv", "Swedish"], ["ta", "Tamil"], ["te", "Telugu"],
  ["th", "Thai"], ["tr", "Turkish"], ["uk", "Ukrainian"], ["ur", "Urdu"],
  ["vi", "Vietnamese"], ["cy", "Welsh"],
];

export const languageCodes = new Set(languages.map(([code]) => code));
export const languageName = (code: string) => languages.find(([value]) => value === code)?.[1] ?? code;

/** Enabled out of the box. Every other language is opt-in from Settings. */
export const defaultLanguageCodes = ["pt", "en", "fr", "es"];

/** Two languages are the minimum needed to describe a source and a different target. */
export const minimumEnabledLanguages = 2;

export function parseEnabledLanguages(value: string | null | undefined): string[] {
  const codes = [...new Set((value ?? "").split(",").map((code) => code.trim()).filter((code) => languageCodes.has(code)))];
  return codes.length >= minimumEnabledLanguages ? codes : [...defaultLanguageCodes];
}

export const serializeEnabledLanguages = (codes: string[]) => [...new Set(codes)].join(",");

/**
 * Languages offered in a menu: the enabled set, plus any code already in use, so an
 * existing book or saved translation never vanishes from its own form.
 */
export function languageOptions(enabled: string[], include: (string | null | undefined)[] = []): Language[] {
  const codes = new Set([...enabled, ...include.filter((code): code is string => Boolean(code))]);
  return languages.filter(([code]) => codes.has(code));
}
