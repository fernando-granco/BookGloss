import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validation";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: { _count: { select: { words: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(books);
  } catch (error) {
    return apiError(error, "Could not load your library");
  }
}

export async function POST(request: Request) {
  try {
    const data = bookSchema.parse(await request.json());
    const book = await prisma.book.create({
      data: { ...data, author: data.author || null, secondaryLanguage: data.secondaryLanguage || null },
      include: { _count: { select: { words: true } } },
    });
    return Response.json(book, { status: 201 });
  } catch (error) {
    return apiError(error, "Could not create the book");
  }
}
