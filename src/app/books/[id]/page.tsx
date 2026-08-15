import type { Metadata } from "next";
import { BookView } from "@/components/book-view";

export const metadata: Metadata = { title: "Vocabulary" };

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookView bookId={id} />;
}
