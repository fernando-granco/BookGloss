-- Preserve the currently selected language alongside the displayed translation.
ALTER TABLE "Word" ADD COLUMN "translationLanguage" TEXT NOT NULL DEFAULT 'en';

UPDATE "Word"
SET "translationLanguage" = (
    SELECT "targetLanguage" FROM "Book" WHERE "Book"."id" = "Word"."bookId"
);

-- Store one saved translation per word and target language.
CREATE TABLE "WordTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wordId" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WordTranslation_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WordTranslation_wordId_createdAt_idx" ON "WordTranslation"("wordId", "createdAt");
CREATE UNIQUE INDEX "WordTranslation_wordId_targetLanguage_key" ON "WordTranslation"("wordId", "targetLanguage");

INSERT INTO "WordTranslation" ("id", "wordId", "targetLanguage", "translation", "manuallyEdited", "createdAt", "updatedAt")
SELECT 'migrated-' || "id", "id", "translationLanguage", "translation", "translationManuallyEdited", "createdAt", "updatedAt"
FROM "Word";

-- Move installations that still use the original untouched defaults to French → English.
UPDATE "Settings"
SET "defaultSourceLanguage" = 'fr', "defaultTargetLanguage" = 'en', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'singleton' AND "defaultSourceLanguage" = 'en' AND "defaultTargetLanguage" = 'pt';
