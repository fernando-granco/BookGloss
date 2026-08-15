import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  console.error(fallback, error instanceof Error ? error.message : error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
