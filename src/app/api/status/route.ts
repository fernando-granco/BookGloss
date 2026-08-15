import { translationConfigured } from "@/lib/translation";

export async function GET() {
  return Response.json({ translationConfigured: translationConfigured() });
}
