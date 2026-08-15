import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { translationService } from "@/lib/translation";
import { normalizeWord, updateWordSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const input = updateWordSchema.parse(await request.json());
    const current = await prisma.word.findUnique({ where: { id }, include: { book: true } });
    if (!current) return Response.json({ error: "Word not found" }, { status: 404 });

    const data: Prisma.WordUpdateInput = {};
    if (input.original !== undefined) {
      data.original = input.original;
      data.normalizedOriginal = normalizeWord(input.original);
    }
    if (input.translation !== undefined) {
      data.translation = input.translation;
      data.translationManuallyEdited = true;
    }
    if (input.page !== undefined) data.page = input.page;
    if (input.context !== undefined) data.context = input.context || null;
    if (input.favorite !== undefined) data.favorite = input.favorite;
    if (input.retranslate) {
      data.translation = await translationService.translate({
        text: input.original ?? current.original,
        sourceLanguage: current.book.sourceLanguage,
        targetLanguage: current.book.targetLanguage,
      });
      data.translationManuallyEdited = false;
    }

    return Response.json(await prisma.word.update({ where: { id }, data }));
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
