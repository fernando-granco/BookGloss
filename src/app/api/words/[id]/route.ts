import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { translationService } from "@/lib/translation";
import { normalizeWord, updateWordSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const translations = { orderBy: { createdAt: "desc" as const } };
const withTranslations = { include: { translations } };

const readWord = (id: string) => prisma.word.findUniqueOrThrow({ where: { id }, ...withTranslations });

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const input = updateWordSchema.parse(await request.json());
    const current = await prisma.word.findUnique({ where: { id }, include: { book: true, translations } });
    if (!current) return Response.json({ error: "Word not found" }, { status: 404 });
    const saved = (language: string) => current.translations.find((item) => item.targetLanguage === language);

    // Show a different saved translation first. The old first one stays in history.
    if (input.selectTranslationLanguage) {
      const selected = saved(input.selectTranslationLanguage);
      if (!selected) return Response.json({ error: "That translation has not been saved yet" }, { status: 404 });
      return Response.json(await prisma.word.update({
        where: { id },
        data: {
          translation: selected.translation,
          translationLanguage: selected.targetLanguage,
          // Never show the same language twice.
          ...(current.secondaryLanguage === selected.targetLanguage ? { secondaryLanguage: current.translationLanguage } : {}),
        },
        ...withTranslations,
      }));
    }

    // Choose (or clear) the translation shown underneath the first one.
    if (input.selectSecondaryLanguage !== undefined) {
      const language = input.selectSecondaryLanguage;
      if (language && !saved(language)) return Response.json({ error: "That translation has not been saved yet" }, { status: 404 });
      if (language === current.translationLanguage) return Response.json({ error: "That translation is already shown first" }, { status: 400 });
      return Response.json(await prisma.word.update({ where: { id }, data: { secondaryLanguage: language }, ...withTranslations }));
    }

    // Translate into a language this word does not have yet.
    if (input.translateToLanguage) {
      if (input.translateToLanguage === current.book.sourceLanguage) {
        return Response.json({ error: "Choose a language different from the source language" }, { status: 400 });
      }
      if (saved(input.translateToLanguage)) return Response.json({ error: "That translation is already saved" }, { status: 409 });

      const translated = await translationService.translate({
        text: current.original,
        sourceLanguage: current.book.sourceLanguage,
        targetLanguage: input.translateToLanguage,
      });
      await prisma.$transaction([
        prisma.wordTranslation.create({ data: { wordId: id, targetLanguage: input.translateToLanguage, translation: translated } }),
        // A new language fills the empty second slot rather than displacing the first one.
        prisma.word.update({ where: { id }, data: { secondaryLanguage: input.translateToLanguage } }),
      ]);
      return Response.json(await readWord(id));
    }

    const data: Prisma.WordUpdateInput = {};
    if (input.original !== undefined) {
      data.original = input.original;
      data.normalizedOriginal = normalizeWord(input.original);
    }
    // Saving the form resubmits the displayed translation, so only a real change is a manual edit.
    const editedTranslation = input.translation !== undefined && input.translation !== current.translation ? input.translation : undefined;
    if (editedTranslation !== undefined) data.translation = editedTranslation;
    if (input.page !== undefined) data.page = input.page;
    if (input.context !== undefined) data.context = input.context || null;
    if (input.favorite !== undefined) data.favorite = input.favorite;

    const retranslated = input.retranslate
      ? await translationService.translate({
          text: input.original ?? current.original,
          sourceLanguage: current.book.sourceLanguage,
          targetLanguage: current.translationLanguage,
        })
      : undefined;
    if (retranslated !== undefined) data.translation = retranslated;

    await prisma.$transaction(async (tx) => {
      await tx.word.update({ where: { id }, data });
      if (typeof data.translation !== "string") return;
      // Keep history in step with the language currently shown first.
      const manuallyEdited = retranslated === undefined;
      await tx.wordTranslation.upsert({
        where: { wordId_targetLanguage: { wordId: id, targetLanguage: current.translationLanguage } },
        update: { translation: data.translation, manuallyEdited },
        create: { wordId: id, targetLanguage: current.translationLanguage, translation: data.translation, manuallyEdited },
      });
    });
    return Response.json(await readWord(id));
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
