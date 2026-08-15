import { beforeEach, describe, expect, it, vi } from "vitest";

type Translation = { id: string; wordId: string; targetLanguage: string; translation: string; manuallyEdited: boolean; createdAt: Date; updatedAt: Date };
type Word = { id: string; original: string; translation: string; translationLanguage: string; translationManuallyEdited: boolean; page: number | null; context: string | null; normalizedOriginal: string; favorite: boolean };

const book = { id: "book-1", sourceLanguage: "fr", targetLanguage: "en" };
let word: Word;
let history: Translation[];

const at = (day: number) => new Date(`2026-08-${String(day).padStart(2, "0")}T10:00:00Z`);
const withHistory = () => ({ ...word, book, translations: [...history].sort((a, b) => +b.createdAt - +a.createdAt) });

const prisma = {
  word: {
    findUnique: vi.fn(async () => (word ? withHistory() : null)),
    findUniqueOrThrow: vi.fn(async () => withHistory()),
    update: vi.fn(async ({ data }: { data: Partial<Word> }) => { word = { ...word, ...data }; return withHistory(); }),
  },
  wordTranslation: {
    create: vi.fn(async ({ data }: { data: Omit<Translation, "id" | "createdAt" | "updatedAt" | "manuallyEdited"> & { manuallyEdited?: boolean } }) => {
      const created = { id: `t-${history.length + 1}`, manuallyEdited: false, createdAt: at(20), updatedAt: at(20), ...data };
      history.push(created);
      return created;
    }),
    upsert: vi.fn(async ({ where, update, create }: { where: { wordId_targetLanguage: { wordId: string; targetLanguage: string } }; update: Partial<Translation>; create: Omit<Translation, "id" | "createdAt" | "updatedAt"> }) => {
      const existing = history.find((item) => item.targetLanguage === where.wordId_targetLanguage.targetLanguage);
      if (existing) return Object.assign(existing, update);
      const created = { id: `t-${history.length + 1}`, createdAt: at(20), updatedAt: at(20), ...create };
      history.push(created);
      return created;
    }),
  },
  $transaction: vi.fn(async (arg: unknown) => (typeof arg === "function" ? (arg as (tx: unknown) => unknown)(prisma) : Promise.all(arg as Promise<unknown>[]))),
};

const translate = vi.fn(async ({ targetLanguage }: { targetLanguage: string }) => `machine-${targetLanguage}`);

vi.mock("@/lib/prisma", () => ({ get prisma() { return prisma; } }));
vi.mock("@/lib/translation", () => ({ translationService: { translate: (...args: unknown[]) => translate(...(args as [{ targetLanguage: string }])) } }));

const { PATCH } = await import("@/app/api/words/[id]/route");

const patch = async (body: unknown) => {
  const response = await PATCH(new Request("http://test/api/words/word-1", { method: "PATCH", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "word-1" }) });
  return { status: response.status, body: await response.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  word = { id: "word-1", original: "chaleur", translation: "heat", translationLanguage: "en", translationManuallyEdited: false, page: 142, context: null, normalizedOriginal: "chaleur", favorite: false };
  history = [{ id: "t-1", wordId: "word-1", targetLanguage: "en", translation: "heat", manuallyEdited: false, createdAt: at(10), updatedAt: at(10) }];
});

describe("selecting a saved translation", () => {
  it("switches the displayed translation and carries its manual flag", async () => {
    history.push({ id: "t-2", wordId: "word-1", targetLanguage: "pt", translation: "calor à mão", manuallyEdited: true, createdAt: at(12), updatedAt: at(12) });
    const { status, body } = await patch({ selectTranslationLanguage: "pt" });
    expect(status).toBe(200);
    expect(body).toMatchObject({ translation: "calor à mão", translationLanguage: "pt", translationManuallyEdited: true });
    expect(translate).not.toHaveBeenCalled();
    expect(history).toHaveLength(2);
  });

  it("rejects a language that has not been saved yet", async () => {
    const { status, body } = await patch({ selectTranslationLanguage: "es" });
    expect(status).toBe(404);
    expect(body.error).toMatch(/not been saved/);
  });
});

describe("adding another translation language", () => {
  it("translates once and keeps the earlier translation in history", async () => {
    const { status, body } = await patch({ translateToLanguage: "pt" });
    expect(status).toBe(200);
    expect(translate).toHaveBeenCalledWith({ text: "chaleur", sourceLanguage: "fr", targetLanguage: "pt" });
    expect(body).toMatchObject({ translation: "machine-pt", translationLanguage: "pt", translationManuallyEdited: false });
    expect(history.map((item) => [item.targetLanguage, item.translation])).toEqual([["en", "heat"], ["pt", "machine-pt"]]);
  });

  it("reuses an already saved language instead of translating again", async () => {
    history.push({ id: "t-2", wordId: "word-1", targetLanguage: "pt", translation: "calor", manuallyEdited: false, createdAt: at(12), updatedAt: at(12) });
    const { body } = await patch({ translateToLanguage: "pt" });
    expect(translate).not.toHaveBeenCalled();
    expect(body).toMatchObject({ translation: "calor", translationLanguage: "pt" });
  });

  it("refuses to translate into the book's own source language", async () => {
    const { status, body } = await patch({ translateToLanguage: "fr" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/different from the source language/);
    expect(translate).not.toHaveBeenCalled();
  });
});

describe("manual edits and retranslation", () => {
  it("keeps a manual edit against the language it was written for", async () => {
    word.translationLanguage = "pt";
    history.push({ id: "t-2", wordId: "word-1", targetLanguage: "pt", translation: "calor", manuallyEdited: false, createdAt: at(12), updatedAt: at(12) });
    await patch({ original: "chaleur", translation: "calor abafado", page: 142, context: null });
    expect(history.find((item) => item.targetLanguage === "pt")).toMatchObject({ translation: "calor abafado", manuallyEdited: true });
    expect(history.find((item) => item.targetLanguage === "en")).toMatchObject({ translation: "heat", manuallyEdited: false });
  });

  it("does not mark an unchanged translation as manually edited", async () => {
    await patch({ original: "chaleur", translation: "heat", page: 7, context: null });
    expect(word.page).toBe(7);
    expect(word.translationManuallyEdited).toBe(false);
    expect(history[0]).toMatchObject({ translation: "heat", manuallyEdited: false });
  });

  it("retranslates into the currently selected language, not the book target", async () => {
    word.translationLanguage = "pt";
    word.translationManuallyEdited = true;
    history.push({ id: "t-2", wordId: "word-1", targetLanguage: "pt", translation: "meu texto", manuallyEdited: true, createdAt: at(12), updatedAt: at(12) });
    await patch({ original: "chaleur", translation: "meu texto", page: 142, context: null, retranslate: true });
    expect(translate).toHaveBeenCalledWith({ text: "chaleur", sourceLanguage: "fr", targetLanguage: "pt" });
    expect(word).toMatchObject({ translation: "machine-pt", translationManuallyEdited: false });
    expect(history.find((item) => item.targetLanguage === "pt")).toMatchObject({ translation: "machine-pt", manuallyEdited: false });
    expect(history.find((item) => item.targetLanguage === "en")).toMatchObject({ translation: "heat" });
  });
});
