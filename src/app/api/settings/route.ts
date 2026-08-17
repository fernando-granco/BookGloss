import { apiError } from "@/lib/api";
import { defaultLanguageCodes, parseEnabledLanguages, serializeEnabledLanguages } from "@/lib/languages";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";

const defaults = {
  id: "singleton",
  defaultSourceLanguage: "fr",
  defaultTargetLanguage: "en",
  enabledLanguages: serializeEnabledLanguages([...defaultLanguageCodes]),
  appearance: "system",
};

type StoredSettings = { enabledLanguages: string };
const present = <T extends StoredSettings>({ enabledLanguages, ...rest }: T) => ({ ...rest, enabledLanguages: parseEnabledLanguages(enabledLanguages) });

export async function GET() {
  try {
    return Response.json(present(await prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: defaults })));
  } catch (error) {
    return apiError(error, "Could not load settings");
  }
}

export async function PUT(request: Request) {
  try {
    const { enabledLanguages, ...data } = settingsSchema.parse(await request.json());
    const stored = { ...data, enabledLanguages: serializeEnabledLanguages(enabledLanguages) };
    return Response.json(present(await prisma.settings.upsert({
      where: { id: "singleton" }, update: stored, create: { ...defaults, ...stored },
    })));
  } catch (error) {
    return apiError(error, "Could not save settings");
  }
}
