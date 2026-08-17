import { prisma } from "@/lib/prisma";
import type { NewWord } from "@/lib/word-service";

const translations = { orderBy: { createdAt: "desc" as const } };

export const wordStore = {
  findBook: (id: string) => prisma.book.findUnique({ where: { id } }),
  findWord: (bookId: string, normalizedOriginal: string) =>
    prisma.word.findUnique({ where: { bookId_normalizedOriginal: { bookId, normalizedOriginal } }, include: { translations } }),
  incrementWord: (id: string, page?: number | null) =>
    prisma.word.update({
      where: { id },
      data: { encounterCount: { increment: 1 }, lastEncounteredAt: new Date(), ...(page ? { page } : {}) },
      include: { translations },
    }),
  createWord: ({ translations: saved, ...data }: NewWord) =>
    prisma.word.create({
      data: { ...data, translations: { create: saved } },
      include: { translations },
    }),
};
