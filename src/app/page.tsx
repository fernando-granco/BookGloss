"use client";

import Link from "next/link";
import { BookOpen, Ellipsis, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BookForm, type BookInput } from "@/components/book-form";
import { Modal } from "@/components/modal";
import { languageName } from "@/lib/languages";
import type { BookSummary, SettingsData } from "@/lib/types";

const fallback: SettingsData = { defaultSourceLanguage: "fr", defaultTargetLanguage: "en", appearance: "system" };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? "Request failed"); }
  return response.status === 204 ? (undefined as T) : response.json();
}

export default function BooksPage() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [settings, setSettings] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BookSummary | null | undefined>(undefined);
  const load = useCallback(async () => {
    try { const [items, saved] = await Promise.all([request<BookSummary[]>("/api/books"), request<SettingsData>("/api/settings")]); setBooks(items); setSettings(saved); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(input: BookInput) {
    await request(editing ? `/api/books/${editing.id}` : "/api/books", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    setEditing(undefined); await load();
  }
  async function remove(book: BookSummary) {
    if (!confirm(`Delete “${book.title}” and all its saved words? This cannot be undone.`)) return;
    await request(`/api/books/${book.id}`, { method: "DELETE" }); await load();
  }
  return (
    <main className="shell page">
      <div className="page-title"><div><p className="eyebrow">Your library</p><h1>Books</h1><p>Every unfamiliar word, kept with the story where you found it.</p></div><button className="button" onClick={() => setEditing(null)}><Plus size={18} /> Add book</button></div>
      {loading ? <div className="empty"><span className="spinner" /> Loading your library…</div> : books.length === 0 ? (
        <section className="empty"><BookOpen size={35} /><h2>No books yet</h2><p>Add the book you’re currently reading and start collecting new words.</p><button className="button" onClick={() => setEditing(null)}><Plus size={18} /> Add your first book</button></section>
      ) : <section className="book-grid">{books.map((book) => (
        <article className="book-card" key={book.id}>
          <div className="book-actions"><button className="icon-button" aria-label={`Actions for ${book.title}`}><Ellipsis /></button><div className="menu"><button onClick={() => setEditing(book)}>Edit</button><button className="danger" onClick={() => void remove(book)}>Delete</button></div></div>
          <Link href={`/books/${book.id}`}><div className="book-mark" aria-hidden="true" /><h2>{book.title}</h2><p className="author">{book.author || "Unknown author"}</p><div className="card-meta"><span>{languageName(book.sourceLanguage)} → {languageName(book.targetLanguage)}</span><span>{book._count.words} {book._count.words === 1 ? "word" : "words"}</span></div></Link>
        </article>
      ))}</section>}
      <Modal title={editing ? "Edit book" : "Add a book"} open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <BookForm key={editing?.id ?? "new"} initial={editing ?? undefined} defaults={settings} submitLabel={editing ? "Save changes" : "Add book"} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
    </main>
  );
}
