import { beforeEach, describe, expect, it, vi } from "vitest";

type Translation = { id: string; wordId: string; targetLanguage: string; translation: string; manuallyEdited: boolean; createdAt: Date; updatedAt: Date };
type Word = { id: string; original: string; translation: string; translationLanguage: string; secondaryLanguage: string | null; page: number | null; context: string | null; normalizedOriginal: string; favorite: boolean };

const book = { id: "book-1", sourceLanguage: "fr", targetLanguage: "en" };
let word: Word;
let history: Translation[];

const at = (day: number) => new Date(`2026-08-${String(day).padStart(2, "0")}T10:00:00Z`);
const withHistory = () => ({ ...word, book, translations: [...history].sort((a, b) => +b.createdAt - +a.createdAt) });

const prisma = {
  word: {
    findUnique: vi.fn(async () => withHistory()),
    findUniqueOrThrow: vi.fn(async () => withHistory()),
    update: vi.fn(async ({ data }: { data: Partial<Word> }) => { word = { ...word, ...data }; return withHistory(); }),
  },
  wordTranslation: {
    create: vi.fn(async ({ data }: { data: Omit<Translation, "id" | "createdAt" | "updatedAt" | "manuallyEdited"> }) => {
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
const savedPt = () => history.push({ id: "t-2", wordId: "word-1", targetLanguage: "pt", translation: "calor", manuallyEdited: false, createdAt: at(12), updatedAt: at(12) });

beforeEach(() => {
  vi.clearAllMocks();
  word = { id: "word-1", original: "chaleur", translation: "heat", translationLanguage: "en", secondaryLanguage: null, page: 142, context: null, normalizedOriginal: "chaleur", favorite: false };
  history = [{ id: "t-1", wordId: "word-1", targetLanguage: "en", translation: "heat", manuallyEdited: false, createdAt: at(10), updatedAt: at(10) }];
});

describe("choosing which translations are shown", () => {
  it("promotes a saved translation to the first slot", async () => {
    savedPt();
    const { status, body } = await patch({ selectTranslationLanguage: "pt" });
    expect(status).toBe(200);
    expect(body).toMatchObject({ translation: "calor", translationLanguage: "pt" });
    expect(translate).not.toHaveBeenCalled();
    expect(history).toHaveLength(2);
  });

  it("never shows the same language in both slots", async () => {
    savedPt();
    await patch({ selectSecondaryLanguage: "pt" });
    expect(word.secondaryLanguage).toBe("pt");
    // Promoting the second slot pushes the old first translation into it.
    await patch({ selectTranslationLanguage: "pt" });
    expect(word).toMatchObject({ translationLanguage: "pt", secondaryLanguage: "en" });
  });

  it("sets and clears the second slot", async () => {
    savedPt();
    expect((await patch({ selectSecondaryLanguage: "pt" })).body).toMatchObject({ secondaryLanguage: "pt" });
    expect((await patch({ selectSecondaryLanguage: null })).body).toMatchObject({ secondaryLanguage: null });
  });

  it("refuses a second slot that is not saved, or that repeats the first", async () => {
    expect((await patch({ selectSecondaryLanguage: "es" })).status).toBe(404);
    expect((await patch({ selectSecondaryLanguage: "en" })).status).toBe(400);
    expect((await patch({ selectTranslationLanguage: "es" })).status).toBe(404);
  });
});

describe("adding another translation language", () => {
  it("translates once and fills the empty second slot without displacing the first", async () => {
    const { status, body } = await patch({ translateToLanguage: "pt" });
    expect(status).toBe(200);
    expect(translate).toHaveBeenCalledWith({ text: "chaleur", sourceLanguage: "fr", targetLanguage: "pt" });
    expect(body).toMatchObject({ translation: "heat", translationLanguage: "en", secondaryLanguage: "pt" });
    expect(history.map((item) => [item.targetLanguage, item.translation])).toEqual([["en", "heat"], ["pt", "machine-pt"]]);
  });

  it("refuses to translate into the book's own source language", async () => {
    expect((await patch({ translateToLanguage: "fr" })).status).toBe(400);
    expect(translate).not.toHaveBeenCalled();
  });

  it("refuses to translate a language that is already saved", async () => {
    savedPt();
    expect((await patch({ translateToLanguage: "pt" })).status).toBe(409);
    expect(translate).not.toHaveBeenCalled();
  });
});

describe("manual edits and retranslation", () => {
  it("keeps a manual edit against the language shown first", async () => {
    word.translationLanguage = "pt";
    savedPt();
    await patch({ original: "chaleur", translation: "calor abafado", page: 142, context: null });
    expect(history.find((item) => item.targetLanguage === "pt")).toMatchObject({ translation: "calor abafado", manuallyEdited: true });
    expect(history.find((item) => item.targetLanguage === "en")).toMatchObject({ translation: "heat", manuallyEdited: false });
  });

  it("does not mark an unchanged translation as manually edited", async () => {
    await patch({ original: "chaleur", translation: "heat", page: 7, context: null });
    expect(word.page).toBe(7);
    expect(history[0]).toMatchObject({ translation: "heat", manuallyEdited: false });
  });

  it("retranslates into the language shown first, not the book target", async () => {
    word.translationLanguage = "pt";
    savedPt();
    await patch({ original: "chaleur", translation: "meu texto", page: 142, context: null, retranslate: true });
    expect(translate).toHaveBeenCalledWith({ text: "chaleur", sourceLanguage: "fr", targetLanguage: "pt" });
    expect(word.translation).toBe("machine-pt");
    expect(history.find((item) => item.targetLanguage === "pt")).toMatchObject({ translation: "machine-pt", manuallyEdited: false });
    expect(history.find((item) => item.targetLanguage === "en")).toMatchObject({ translation: "heat" });
  });
});
