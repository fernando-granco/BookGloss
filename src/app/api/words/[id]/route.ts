import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { translationService } from "@/lib/translation";
import { normalizeWord, updateWordSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const translations = { orderBy: { createdAt: "desc" as const } };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const input = updateWordSchema.parse(await request.json());
    const current = await prisma.word.findUnique({ where: { id }, include: { book: true, translations } });
    if (!current) return Response.json({ error: "Word not found" }, { status: 404 });

    if (input.selectTranslationLanguage) {
      const selected = current.translations.find((item) => item.targetLanguage === input.selectTranslationLanguage);
      if (!selected) return Response.json({ error: "That translation has not been saved yet" }, { status: 404 });
      return Response.json(await prisma.word.update({
        where: { id },
        data: { translation: selected.translation, translationLanguage: selected.targetLanguage, translationManuallyEdited: selected.manuallyEdited },
        include: { translations },
      }));
    }

    if (input.translateToLanguage) {
      if (input.translateToLanguage === current.book.sourceLanguage) {
        return Response.json({ error: "Choose a language different from the source language" }, { status: 400 });
      }
      const saved = current.translations.find((item) => item.targetLanguage === input.translateToLanguage);
      if (saved) {
        return Response.json(await prisma.word.update({
          where: { id },
          data: { translation: saved.translation, translationLanguage: saved.targetLanguage, translationManuallyEdited: saved.manuallyEdited },
          include: { translations },
        }));
      }

      const translated = await translationService.translate({
        text: current.original,
        sourceLanguage: current.book.sourceLanguage,
        targetLanguage: input.translateToLanguage,
      });
      await prisma.$transaction([
        prisma.wordTranslation.create({ data: { wordId: id, targetLanguage: input.translateToLanguage, translation: translated } }),
        prisma.word.update({ where: { id }, data: { translation: translated, translationLanguage: input.translateToLanguage, translationManuallyEdited: false } }),
      ]);
      return Response.json(await prisma.word.findUniqueOrThrow({ where: { id }, include: { translations } }));
    }

    const data: Prisma.WordUpdateInput = {};
    let historyManuallyEdited: boolean | undefined;
    if (input.original !== undefined) {
      data.original = input.original;
      data.normalizedOriginal = normalizeWord(input.original);
    }
    if (input.translation !== undefined) {
      data.translation = input.translation;
      data.translationManuallyEdited = true;
      historyManuallyEdited = true;
    }
    if (input.page !== undefined) data.page = input.page;
    if (input.context !== undefined) data.context = input.context || null;
    if (input.favorite !== undefined) data.favorite = input.favorite;
    if (input.retranslate) {
      data.translation = await translationService.translate({
        text: input.original ?? current.original,
        sourceLanguage: current.book.sourceLanguage,
        targetLanguage: current.translationLanguage,
      });
      data.translationManuallyEdited = false;
      historyManuallyEdited = false;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const word = await tx.word.update({ where: { id }, data });
      if (typeof data.translation === "string") {
        await tx.wordTranslation.upsert({
          where: { wordId_targetLanguage: { wordId: id, targetLanguage: current.translationLanguage } },
          update: { translation: data.translation, manuallyEdited: historyManuallyEdited ?? false },
          create: { wordId: id, targetLanguage: current.translationLanguage, translation: data.translation, manuallyEdited: historyManuallyEdited ?? false },
        });
      }
      return word;
    });
    return Response.json(await prisma.word.findUniqueOrThrow({ where: { id: updated.id }, include: { translations } }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "That word already exists in this book" }, { status: 409 });
    }
    return apiError(error, "Could not update the word");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.word.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not delete the word");
  }
}
