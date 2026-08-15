import { addWordSchema } from "@/lib/validation";
import { addWordToBook } from "@/lib/word-service";
import { wordStore } from "@/lib/word-store";
import { translationService } from "@/lib/translation";
import { apiError } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const input = addWordSchema.parse(await request.json());
    const result = await addWordToBook({ bookId: id, ...input }, wordStore, translationService);
    if (result.kind === "not-found") return Response.json({ error: "Book not found" }, { status: 404 });
    return Response.json(result, { status: result.kind === "created" ? 201 : 200 });
  } catch (error) {
    return apiError(error, "Translation failed. Check the translation configuration and try again.");
  }
}
