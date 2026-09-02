import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Network errors from the translation client quote the whole request URL, and that URL
// carries ?key=<credential>. Redact before anything reaches the logs.
const secrets: [RegExp, string][] = [
  [/([?&](?:key|api_?key|access_token|token|password)=)[^&\s"']+/gi, "$1[redacted]"],
  [/\bAIza[0-9A-Za-z_-]{10,}/g, "[redacted]"],
  [/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, "[redacted]"],
];

export function redactSecrets(value: string) {
  return secrets.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function apiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const detail = error instanceof Error ? error.message : String(error);
  console.error(fallback, redactSecrets(detail));
  return NextResponse.json({ error: fallback }, { status: 500 });
}
