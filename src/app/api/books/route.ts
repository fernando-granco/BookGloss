import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validation";
import { apiError } from "@/lib/api";

export async function GET() {
  const books = await prisma.book.findMany({
    include: { _count: { select: { words: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json(books);
}

export async function POST(request: Request) {
  try {
    const data = bookSchema.parse(await request.json());
    const book = await prisma.book.create({
      data: { ...data, author: data.author || null },
      include: { _count: { select: { words: true } } },
    });
    return Response.json(book, { status: 201 });
  } catch (error) {
    return apiError(error, "Could not create the book");
  }
}
