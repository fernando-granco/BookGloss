import { v2 } from "@google-cloud/translate";

export interface TranslationService {
  translate(input: { text: string; sourceLanguage: string; targetLanguage: string }): Promise<string>;
}

class GoogleTranslationService implements TranslationService {
  private client?: v2.Translate;

  private getClient() {
    if (this.client) return this.client;
    const encodedCredentials = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64;
    let credentials: object | undefined;
    if (encodedCredentials) {
      try {
        credentials = JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
      } catch {
        throw new Error("Google Cloud credentials are not valid base64-encoded JSON");
      }
    }
    this.client = new v2.Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      ...(process.env.GOOGLE_TRANSLATE_API_KEY ? { key: process.env.GOOGLE_TRANSLATE_API_KEY } : {}),
      ...(credentials ? { credentials } : {}),
    });
    return this.client;
  }

  async translate({ text, sourceLanguage, targetLanguage }: Parameters<TranslationService["translate"]>[0]) {
    const [result] = await this.getClient().translate(text, { from: sourceLanguage, to: targetLanguage });
    const translation = Array.isArray(result) ? result[0] : result;
    if (!translation?.trim()) throw new Error("Translation provider returned an empty result");
    return translation.trim();
  }
}

export const translationService: TranslationService = new GoogleTranslationService();

export function translationConfigured() {
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY || (process.env.GOOGLE_CLOUD_PROJECT_ID && (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || process.env.GOOGLE_APPLICATION_CREDENTIALS)));
}
