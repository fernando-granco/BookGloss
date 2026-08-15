import { prisma } from "@/lib/prisma";

export const wordStore = {
  findBook: (id: string) => prisma.book.findUnique({ where: { id } }),
  findWord: (bookId: string, normalizedOriginal: string) =>
    prisma.word.findUnique({ where: { bookId_normalizedOriginal: { bookId, normalizedOriginal } }, include: { translations: { orderBy: { createdAt: "desc" } } } }),
  incrementWord: (id: string, page?: number | null) =>
    prisma.word.update({
      where: { id },
      data: { encounterCount: { increment: 1 }, lastEncounteredAt: new Date(), ...(page ? { page } : {}) },
      include: { translations: { orderBy: { createdAt: "desc" } } },
    }),
  createWord: (data: { bookId: string; original: string; normalizedOriginal: string; translation: string; translationLanguage: string; page?: number | null; context?: string | null }) =>
    prisma.word.create({
      data: {
        ...data,
        translations: { create: { targetLanguage: data.translationLanguage, translation: data.translation } },
      },
      include: { translations: { orderBy: { createdAt: "desc" } } },
    }),
};
