"use client";

import { Languages } from "lucide-react";
import { useMemo, useState } from "react";
import { languageName, languageOptions } from "@/lib/languages";
import type { VocabularyWord } from "@/lib/types";

export type WordInput = Pick<VocabularyWord, "original" | "translation" | "page" | "context">;

export function WordForm({ word, sourceLanguage, enabledLanguages, onSubmit, onCancel, onRetranslate, onTranslateTo, onSelectPrimary, onSelectSecondary }: {
  word: VocabularyWord;
  sourceLanguage: string;
  enabledLanguages: string[];
  onSubmit: (input: WordInput) => Promise<void>;
  onCancel: () => void;
  onRetranslate: (input: WordInput) => Promise<VocabularyWord>;
  onTranslateTo: (language: string) => Promise<VocabularyWord>;
  onSelectPrimary: (language: string) => Promise<VocabularyWord>;
  onSelectSecondary: (language: string | null) => Promise<VocabularyWord>;
}) {
  const [active, setActive] = useState(word);
  const [form, setForm] = useState<WordInput>({ original: word.original, translation: word.translation, page: word.page, context: word.context });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const availableLanguages = useMemo(
    () => languageOptions(enabledLanguages).filter(([code]) => code !== sourceLanguage && !active.translations.some((item) => item.targetLanguage === code)),
    [active.translations, enabledLanguages, sourceLanguage],
  );
  const [targetLanguage, setTargetLanguage] = useState("");
  const nextLanguage = availableLanguages.some(([code]) => code === targetLanguage) ? targetLanguage : availableLanguages[0]?.[0] ?? "";

  const update = (patch: Partial<WordInput>) => setForm((current) => ({ ...current, ...patch }));

  async function act(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save word"); } finally { setBusy(false); }
  }
  const apply = (action: () => Promise<VocabularyWord>) => async () => {
    const updated = await action();
    setActive(updated);
    setForm((current) => ({ ...current, translation: updated.translation }));
  };

  return <form className="stack" onSubmit={(e) => { e.preventDefault(); void act(() => onSubmit(form)); }}>
    <label>Original word<input autoFocus required maxLength={200} value={form.original} onChange={(e) => update({ original: e.target.value })} /></label>
    <label>Translation · {languageName(active.translationLanguage)}<input required maxLength={500} value={form.translation} onChange={(e) => update({ translation: e.target.value })} /></label>

    <section className="translation-history" aria-labelledby="translation-history-title">
      <div className="section-heading">
        <h3 id="translation-history-title"><Languages size={17} /> Translations</h3>
        <p>Show up to two of these in the vocabulary list.</p>
      </div>
      <ul className="history-list">{active.translations.map((item) => {
        const isPrimary = item.targetLanguage === active.translationLanguage;
        const isSecondary = item.targetLanguage === active.secondaryLanguage;
        return <li key={item.id} className={isPrimary || isSecondary ? "shown" : ""}>
          <span className="history-text"><strong>{languageName(item.targetLanguage)}</strong><small>{item.translation}</small></span>
          <span className="slot-toggles">
            <button type="button" className={isPrimary ? "slot on" : "slot"} disabled={busy || isPrimary} aria-pressed={isPrimary}
              onClick={() => void act(apply(() => onSelectPrimary(item.targetLanguage)))}>1st</button>
            <button type="button" className={isSecondary ? "slot on" : "slot"} disabled={busy || isPrimary} aria-pressed={isSecondary}
              onClick={() => void act(apply(() => onSelectSecondary(isSecondary ? null : item.targetLanguage)))}>2nd</button>
          </span>
        </li>;
      })}</ul>
      {availableLanguages.length > 0 && <div className="add-translation">
        <label>Translate into
          <select value={nextLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
            {availableLanguages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <button type="button" className="button secondary" disabled={busy || !nextLanguage} onClick={() => void act(apply(() => onTranslateTo(nextLanguage)))}>{busy ? "Translating…" : "Add translation"}</button>
      </div>}
    </section>

    <label>Page <span className="muted">optional</span><input type="number" min="1" max="100000" value={form.page ?? ""} onChange={(e) => update({ page: e.target.value ? Number(e.target.value) : null })} /></label>
    <label>Context <span className="muted">optional</span><textarea maxLength={2000} rows={4} value={form.context ?? ""} onChange={(e) => update({ context: e.target.value })} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="form-actions spread">
      <button type="button" className="text-button" disabled={busy} onClick={() => void act(apply(() => onRetranslate(form)))}>Retranslate {languageName(active.translationLanguage)}</button>
      <span><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></span>
    </div>
  </form>;
}
