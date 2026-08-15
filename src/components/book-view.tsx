"use client";

import Link from "next/link";
import { ArrowDownAZ, ArrowLeft, ChevronDown, CornerDownLeft, Pencil, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { WordForm, type WordInput } from "@/components/word-form";
import { languageName } from "@/lib/languages";
import type { BookDetail, VocabularyWord } from "@/lib/types";

type Sort = "recent" | "oldest" | "az" | "za" | "encounters";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error ?? "Request failed"); }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function BookView({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookDetail | null>(null);
  const [word, setWord] = useState(""); const [page, setPage] = useState(""); const [context, setContext] = useState("");
  const [details, setDetails] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const [search, setSearch] = useState(""); const [sort, setSort] = useState<Sort>("recent"); const [favorites, setFavorites] = useState(false);
  const [editing, setEditing] = useState<VocabularyWord | null>(null); const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null); const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void request<BookDetail>(`/api/books/${bookId}`).then((data) => { setBook(data); requestAnimationFrame(() => inputRef.current?.focus()); }); }, [bookId]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault(); if (!word.trim() || busy) return; setBusy(true); setMessage("");
    try {
      const result = await request<{ kind: "created" | "duplicate"; word: VocabularyWord }>(`/api/books/${bookId}/words`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ original: word, page: page ? Number(page) : null, context: context || null }) });
      setBook((current) => current ? { ...current, words: [result.word, ...current.words.filter((item) => item.id !== result.word.id)], _count: { words: current._count.words + (result.kind === "created" ? 1 : 0) } } : current);
      setMessage(result.kind === "duplicate" ? `Already saved — encountered ${result.word.encounterCount}×` : "");
      setWord(""); setPage(""); setContext(""); setDetails(false);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Translation failed. Try again."); }
    finally { setBusy(false); requestAnimationFrame(() => inputRef.current?.focus()); }
  }
  async function patchWord(id: string, data: Record<string, unknown>) {
    const updated = await request<VocabularyWord>(`/api/words/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setBook((current) => current ? { ...current, words: current.words.map((item) => item.id === id ? updated : item) } : current); return updated;
  }
  async function saveEdit(input: WordInput, retranslate = false) { await patchWord(editing!.id, { ...input, retranslate }); setEditing(null); inputRef.current?.focus(); }
  async function remove(item: VocabularyWord) {
    if (!confirm(`Delete “${item.original}”?`)) return; await request(`/api/words/${item.id}`, { method: "DELETE" });
    setBook((current) => current ? { ...current, words: current.words.filter((wordItem) => wordItem.id !== item.id), _count: { words: current._count.words - 1 } } : current);
  }
  const visible = useMemo(() => {
    if (!book) return [];
    const query = search.trim().toLocaleLowerCase();
    const words = book.words.filter((item) => (!favorites || item.favorite) && (!query || item.original.toLocaleLowerCase().includes(query) || item.translation.toLocaleLowerCase().includes(query)));
    return [...words].sort((a, b) => sort === "oldest" ? +new Date(a.createdAt) - +new Date(b.createdAt) : sort === "az" ? a.original.localeCompare(b.original) : sort === "za" ? b.original.localeCompare(a.original) : sort === "encounters" ? b.encounterCount - a.encounterCount : +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [book, favorites, search, sort]);

  if (!book) return <main className="shell page"><div className="empty"><span className="spinner" /> Opening book…</div></main>;
  return <main className="shell page book-page">
    <Link href="/" className="back-link"><ArrowLeft size={17} /> Books</Link>
    <header className="book-heading"><div><p className="eyebrow">{languageName(book.sourceLanguage)} → {languageName(book.targetLanguage)}</p><h1>{book.title}</h1>{book.author && <p>{book.author}</p>}</div><strong>{book._count.words} {book._count.words === 1 ? "word" : "words"}</strong></header>
    <form className={`word-entry ${busy ? "busy" : ""}`} onSubmit={add}>
      <input ref={inputRef} maxLength={200} value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Type a word…" aria-label="Word to translate" disabled={busy} />
      {busy ? <span className="spinner" aria-label="Translating" /> : <button aria-label="Translate and save"><CornerDownLeft /></button>}
    </form>
    <div className="entry-extras"><button className="text-button" onClick={() => setDetails((value) => !value)}><ChevronDown size={15} className={details ? "rotated" : ""} /> {details ? "Hide details" : "Add page or context"}</button>{message && <p role="status" className={message.startsWith("Already") ? "notice-inline" : "error-inline"}>{message}</p>}</div>
    {details && <div className="optional-fields"><label>Page<input type="number" min="1" max="100000" value={page} onChange={(e) => setPage(e.target.value)} /></label><label>Context<textarea rows={2} maxLength={2000} value={context} onChange={(e) => setContext(e.target.value)} placeholder="The sentence where you found it…" /></label></div>}
    <div className="toolbar"><label className="search"><Search size={17} /><input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search words…" aria-label="Search words" /><kbd>/</kbd></label><label className="select-wrap"><ArrowDownAZ size={17} /><select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort words"><option value="recent">Recently added</option><option value="oldest">Oldest added</option><option value="az">Alphabetical A–Z</option><option value="za">Alphabetical Z–A</option><option value="encounters">Most encountered</option></select></label><button className={`filter-button ${favorites ? "active" : ""}`} onClick={() => setFavorites((value) => !value)}><Star size={17} fill={favorites ? "currentColor" : "none"} /> Favorites</button></div>
    {visible.length === 0 ? <section className="empty compact"><h2>{book.words.length ? "No matching words" : "No words yet"}</h2><p>{book.words.length ? "Try another search or filter." : "When you find a word you don’t know, type it above."}</p></section> : <section className="word-list" aria-label="Vocabulary">{visible.map((item) => <article key={item.id} className="word-row">
      <button className={`star-button ${item.favorite ? "active" : ""}`} onClick={() => void patchWord(item.id, { favorite: !item.favorite })} aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}><Star fill={item.favorite ? "currentColor" : "none"} /></button>
      <div className="word-pair"><button className="word-original" onClick={() => { if (item.context) setExpanded((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; }); }}>{item.original}{item.context && <ChevronDown size={14} className={expanded.has(item.id) ? "rotated" : ""} />}</button>{expanded.has(item.id) && item.context && <p className="context">“{item.context}”</p>}</div>
      <button className="translation" onClick={() => setEditing(item)} title="Edit translation">{item.translation}</button>
      <div className="word-meta">{item.page && <span>p. {item.page}</span>}{item.encounterCount > 1 && <strong>{item.encounterCount}×</strong>}</div>
      <div className="row-actions"><button className="icon-button" onClick={() => setEditing(item)} aria-label={`Edit ${item.original}`}><Pencil /></button><button className="icon-button danger" onClick={() => void remove(item)} aria-label={`Delete ${item.original}`}><Trash2 /></button></div>
    </article>)}</section>}
    <Modal title="Edit word" open={Boolean(editing)} onClose={() => setEditing(null)}>{editing && <WordForm word={editing} onSubmit={(input) => saveEdit(input)} onRetranslate={(input) => saveEdit(input, true)} onCancel={() => setEditing(null)} />}</Modal>
  </main>;
}
