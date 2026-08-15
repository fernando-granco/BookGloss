import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validation";
import { apiError } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: { words: { orderBy: { createdAt: "desc" } }, _count: { select: { words: true } } },
  });
  return book ? Response.json(book) : Response.json({ error: "Book not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const data = bookSchema.parse(await request.json());
    const book = await prisma.book.update({ where: { id }, data: { ...data, author: data.author || null } });
    return Response.json(book);
  } catch (error) {
    return apiError(error, "Could not update the book");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.book.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Could not delete the book");
  }
}
