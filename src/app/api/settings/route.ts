import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";

const defaults = { id: "singleton", defaultSourceLanguage: "en", defaultTargetLanguage: "pt", appearance: "system" };

export async function GET() {
  const settings = await prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: defaults });
  return Response.json(settings);
}

export async function PUT(request: Request) {
  try {
    const data = settingsSchema.parse(await request.json());
    return Response.json(await prisma.settings.upsert({
      where: { id: "singleton" }, update: data, create: { ...defaults, ...data },
    }));
  } catch (error) {
    return apiError(error, "Could not save settings");
  }
}
