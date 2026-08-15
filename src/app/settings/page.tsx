"use client";

import { Check, Circle, Cloud, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { languages } from "@/lib/languages";
import type { SettingsData } from "@/lib/types";

const initial: SettingsData = { defaultSourceLanguage: "en", defaultTargetLanguage: "pt", appearance: "system" };

export default function SettingsPage() {
  const [form, setForm] = useState(initial); const [configured, setConfigured] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(true);
  const { setTheme } = useTheme();
  useEffect(() => { Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/status").then((r) => r.json())]).then(([settings, status]) => { setForm(settings); setTheme(settings.appearance); setConfigured(status.translationConfigured); }).finally(() => setBusy(false)); }, [setTheme]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!response.ok) { const body = await response.json(); setError(body.error ?? "Could not save settings"); } else { setTheme(form.appearance); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setBusy(false);
  }
  const update = (key: keyof SettingsData, value: string) => setForm((current) => ({ ...current, [key]: value } as SettingsData));
  return <main className="shell page settings-page">
    <div className="page-title"><div><p className="eyebrow">Preferences</p><h1>Settings</h1><p>A few quiet defaults for your reading practice.</p></div></div>
    <form className="settings-card" onSubmit={save}>
      <section><h2>New book defaults</h2><p>Used to prefill the languages when you add a book.</p><div className="form-grid"><label>Source language<select value={form.defaultSourceLanguage} onChange={(e) => update("defaultSourceLanguage", e.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><label>Translation language<select value={form.defaultTargetLanguage} onChange={(e) => update("defaultTargetLanguage", e.target.value)}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div></section>
      <section><h2>Appearance</h2><p>Choose how BookGloss feels in this browser.</p><div className="appearance-options">{(["system", "light", "dark"] as const).map((value) => <label key={value} className={form.appearance === value ? "selected" : ""}><input type="radio" name="appearance" checked={form.appearance === value} onChange={() => update("appearance", value)} />{value === "light" ? <Sun /> : value === "dark" ? <Moon /> : <Circle />}<span>{value[0].toUpperCase() + value.slice(1)}</span>{form.appearance === value && <Check className="check" />}</label>)}</div></section>
      <section><h2>Google Translation</h2><p>Credentials are read securely on the server and never sent to the browser.</p><div className={`connection ${configured ? "connected" : ""}`}><Cloud /><span><strong>{configured ? "Connected" : "Not configured"}</strong><small>{configured ? "Environment variables are present." : "Add Google Cloud credentials to the deployment environment."}</small></span></div></section>
      {error && <p className="error" role="alert">{error}</p>}<div className="settings-save"><span aria-live="polite">{saved ? "Changes saved" : ""}</span><button className="button" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button></div>
    </form>
  </main>;
}
