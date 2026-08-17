"use client";

import { Check, Circle, Cloud, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { defaultLanguageCodes, languageOptions, languages, minimumEnabledLanguages } from "@/lib/languages";
import type { SettingsData } from "@/lib/types";

const initial: SettingsData = { defaultSourceLanguage: "fr", defaultTargetLanguage: "en", enabledLanguages: [...defaultLanguageCodes], appearance: "system" };

export default function SettingsPage() {
  const [form, setForm] = useState(initial);
  const [configured, setConfigured] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const { setTheme } = useTheme();

  useEffect(() => {
    Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/status").then((r) => r.json())])
      .then(([settings, status]) => { setForm(settings); setTheme(settings.appearance); setConfigured(status.translationConfigured); })
      .catch(() => setError("Could not load settings"))
      .finally(() => setBusy(false));
  }, [setTheme]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error ?? "Could not save settings");
      else { setForm(body); setTheme(body.appearance); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch { setError("Could not save settings"); }
    finally { setBusy(false); }
  }

  const update = <Key extends keyof SettingsData>(key: Key, value: SettingsData[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const choices = languageOptions(form.enabledLanguages, [form.defaultSourceLanguage, form.defaultTargetLanguage]);
  const enabled = new Set(form.enabledLanguages);
  // A default language must stay enabled, and two languages are the minimum for any pair.
  const locked = (code: string) =>
    code === form.defaultSourceLanguage || code === form.defaultTargetLanguage || (enabled.has(code) && form.enabledLanguages.length <= minimumEnabledLanguages);

  function toggle(code: string) {
    update("enabledLanguages", enabled.has(code) ? form.enabledLanguages.filter((item) => item !== code) : [...form.enabledLanguages, code]);
  }

  return <main className="shell page settings-page">
    <div className="page-title"><div><p className="eyebrow">Preferences</p><h1>Settings</h1><p>A few quiet defaults for your reading practice.</p></div></div>
    <form className="settings-card" onSubmit={save}>
      <section>
        <h2>Default languages</h2>
        <p>Used to prefill each new book.</p>
        <div className="form-grid">
          <label>Source language<select value={form.defaultSourceLanguage} onChange={(e) => update("defaultSourceLanguage", e.target.value)}>{choices.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label>Translation language<select value={form.defaultTargetLanguage} onChange={(e) => update("defaultTargetLanguage", e.target.value)}>{choices.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        </div>
      </section>

      <section>
        <h2>Available languages</h2>
        <p>Tick the languages you want offered in every menu. {form.enabledLanguages.length} of {languages.length} enabled.</p>
        <ul className="language-picker">{languages.map(([code, name]) => {
          const isOn = enabled.has(code);
          return <li key={code}>
            <label className={isOn ? "on" : ""}>
              <input type="checkbox" checked={isOn} disabled={locked(code)} onChange={() => toggle(code)} />
              <span>{name}</span>
            </label>
          </li>;
        })}</ul>
        <p className="hint">Default languages stay ticked, and at least {minimumEnabledLanguages} must remain enabled. A language already used by a book keeps showing in that book’s form.</p>
      </section>

      <section>
        <h2>Appearance</h2>
        <p>Choose how BookGloss feels in this browser.</p>
        <div className="appearance-options">{(["system", "light", "dark"] as const).map((value) => <label key={value} className={form.appearance === value ? "selected" : ""}><input type="radio" name="appearance" checked={form.appearance === value} onChange={() => update("appearance", value)} />{value === "light" ? <Sun /> : value === "dark" ? <Moon /> : <Circle />}<span>{value[0].toUpperCase() + value.slice(1)}</span>{form.appearance === value && <Check className="check" />}</label>)}</div>
      </section>

      <section>
        <h2>Google Translation</h2>
        <p>Credentials are read securely on the server and never sent to the browser.</p>
        <div className={`connection ${configured ? "connected" : ""}`}><Cloud /><span><strong>{configured ? "Connected" : "Not configured"}</strong><small>{configured ? "Environment variables are present." : "Add Google Cloud credentials to the deployment environment."}</small></span></div>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="settings-save"><span aria-live="polite">{saved ? "Changes saved" : ""}</span><button className="button" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button></div>
    </form>
  </main>;
}
