"use client";

import { useState } from "react";
import type { VocabularyWord } from "@/lib/types";

export type WordInput = Pick<VocabularyWord, "original" | "translation" | "page" | "context">;

export function WordForm({ word, onSubmit, onCancel, onRetranslate }: {
  word: VocabularyWord; onSubmit: (input: WordInput) => Promise<void>; onCancel: () => void; onRetranslate: (input: WordInput) => Promise<void>;
}) {
  const [form, setForm] = useState<WordInput>({ original: word.original, translation: word.translation, page: word.page, context: word.context });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const update = (key: keyof WordInput, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));
  async function act(action: () => Promise<void>) { setBusy(true); setError(""); try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save word"); } finally { setBusy(false); } }
  return <form className="stack" onSubmit={(e) => { e.preventDefault(); void act(() => onSubmit(form)); }}>
    <label>Original word<input autoFocus required maxLength={200} value={form.original} onChange={(e) => update("original", e.target.value)} /></label>
    <label>Translation<input required maxLength={500} value={form.translation} onChange={(e) => update("translation", e.target.value)} /></label>
    <label>Page <span className="muted">optional</span><input type="number" min="1" value={form.page ?? ""} onChange={(e) => update("page", e.target.value ? Number(e.target.value) : null)} /></label>
    <label>Context <span className="muted">optional</span><textarea maxLength={2000} rows={4} value={form.context ?? ""} onChange={(e) => update("context", e.target.value)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="form-actions spread"><button type="button" className="text-button" disabled={busy} onClick={() => void act(() => onRetranslate(form))}>Retranslate</button><span><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></span></div>
  </form>;
}
