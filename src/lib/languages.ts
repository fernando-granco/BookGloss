export const languages = [
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
] as const;

export type LanguageCode = (typeof languages)[number][0];
export const languageCodes = new Set<string>(languages.map(([code]) => code));
export const languageName = (code: string) => languages.find(([value]) => value === code)?.[1] ?? code;

export const defaultLanguageCodes = ["pt", "fr", "en", "es"] as const;

export function languageOptions(showAll: boolean, include: string[] = []) {
  if (showAll) return languages;
  const codes = [...defaultLanguageCodes, ...include.filter((code) => !defaultLanguageCodes.includes(code as (typeof defaultLanguageCodes)[number]))];
  return codes.flatMap((code) => {
    const language = languages.find(([value]) => value === code);
    return language ? [language] : [];
  });
}
