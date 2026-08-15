"use client";

import { Check, Languages } from "lucide-react";
import { useMemo, useState } from "react";
import { languageName, languageOptions } from "@/lib/languages";
import type { VocabularyWord } from "@/lib/types";

export type WordInput = Pick<VocabularyWord, "original" | "translation" | "page" | "context">;

export function WordForm({ word, sourceLanguage, showAllLanguages, onSubmit, onCancel, onRetranslate, onTranslateTo, onSelectTranslation }: {
  word: VocabularyWord;
  sourceLanguage: string;
  showAllLanguages: boolean;
  onSubmit: (input: WordInput) => Promise<void>;
  onCancel: () => void;
  onRetranslate: (input: WordInput) => Promise<VocabularyWord>;
  onTranslateTo: (language: string) => Promise<VocabularyWord>;
  onSelectTranslation: (language: string) => Promise<VocabularyWord>;
}) {
  const [active, setActive] = useState(word);
  const [form, setForm] = useState<WordInput>({ original: word.original, translation: word.translation, page: word.page, context: word.context });
  const availableLanguages = useMemo(() => languageOptions(showAllLanguages).filter(([code]) => code !== sourceLanguage && !active.translations.some((item) => item.targetLanguage === code)), [active.translations, showAllLanguages, sourceLanguage]);
  const [targetLanguage, setTargetLanguage] = useState<string>(() => availableLanguages[0]?.[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof WordInput, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));

  async function act(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save word"); } finally { setBusy(false); }
  }
  async function switchTranslation(action: () => Promise<VocabularyWord>) {
    const updated = await action();
    setActive(updated);
    setForm((current) => ({ ...current, translation: updated.translation }));
    const remaining = languageOptions(showAllLanguages).find(([code]) => code !== sourceLanguage && !updated.translations.some((item) => item.targetLanguage === code));
    setTargetLanguage(remaining?.[0] ?? "");
  }

  return <form className="stack" onSubmit={(e) => { e.preventDefault(); void act(() => onSubmit(form)); }}>
    <label>Original word<input autoFocus required maxLength={200} value={form.original} onChange={(e) => update("original", e.target.value)} /></label>
    <label>Translation · {languageName(active.translationLanguage)}<input required maxLength={500} value={form.translation} onChange={(e) => update("translation", e.target.value)} /></label>

    <section className="translation-history" aria-labelledby="translation-history-title">
      <div className="section-heading"><div><h3 id="translation-history-title"><Languages size={17} /> Translations</h3><p>Choose which translation appears in the vocabulary list.</p></div></div>
      <div className="history-list">{active.translations.map((item) => (
        <button key={item.id} type="button" className={item.targetLanguage === active.translationLanguage ? "current" : ""} disabled={busy} onClick={() => void act(() => switchTranslation(() => onSelectTranslation(item.targetLanguage)))}>
          <span><strong>{languageName(item.targetLanguage)}</strong><small>{item.translation}</small></span>
          {item.targetLanguage === active.translationLanguage && <Check aria-label="Currently selected" />}
        </button>
      ))}</div>
      {availableLanguages.length > 0 && <div className="add-translation"><label>Translate into<select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>{availableLanguages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><button type="button" className="button secondary" disabled={busy || !targetLanguage} onClick={() => void act(() => switchTranslation(() => onTranslateTo(targetLanguage)))}>{busy ? "Translating…" : "Add translation"}</button></div>}
    </section>

    <label>Page <span className="muted">optional</span><input type="number" min="1" value={form.page ?? ""} onChange={(e) => update("page", e.target.value ? Number(e.target.value) : null)} /></label>
    <label>Context <span className="muted">optional</span><textarea maxLength={2000} rows={4} value={form.context ?? ""} onChange={(e) => update("context", e.target.value)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="form-actions spread"><button type="button" className="text-button" disabled={busy} onClick={() => void act(() => switchTranslation(() => onRetranslate(form)))}>Retranslate {languageName(active.translationLanguage)}</button><span><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></span></div>
  </form>;
}
