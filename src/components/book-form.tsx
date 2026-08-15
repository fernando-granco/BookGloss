"use client";

import { useState } from "react";
import { languages } from "@/lib/languages";
import type { BookSummary, SettingsData } from "@/lib/types";

export type BookInput = Pick<BookSummary, "title" | "author" | "sourceLanguage" | "targetLanguage">;

export function BookForm({ initial, defaults, submitLabel, onSubmit, onCancel }: {
  initial?: BookInput; defaults: SettingsData; submitLabel: string;
  onSubmit: (value: BookInput) => Promise<void>; onCancel: () => void;
}) {
  const [form, setForm] = useState<BookInput>(initial ?? { title: "", author: "", sourceLanguage: defaults.defaultSourceLanguage, targetLanguage: defaults.defaultTargetLanguage });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof BookInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSubmit(form); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save book"); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="stack">
      <label>Book title<input autoFocus required maxLength={200} value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
      <label>Author <span className="muted">optional</span><input maxLength={200} value={form.author ?? ""} onChange={(e) => update("author", e.target.value)} /></label>
      <div className="form-grid">
        <label>Source language<select value={form.sourceLanguage} onChange={(e) => update("sourceLanguage", e.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label>Translation language<select value={form.targetLanguage} onChange={(e) => update("targetLanguage", e.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      </div>
      {initial && (form.sourceLanguage !== initial.sourceLanguage || form.targetLanguage !== initial.targetLanguage) && <p className="notice">Existing words keep their saved translations.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : submitLabel}</button></div>
    </form>
  );
}
