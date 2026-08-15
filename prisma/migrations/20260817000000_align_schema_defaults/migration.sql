-- Align the database with schema.prisma. The earlier migrations left three column
-- defaults behind: Settings still defaulted to en -> pt, and Word.translationLanguage
-- kept the 'en' backfill default. Rows are copied verbatim, so no data changes.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "defaultSourceLanguage" TEXT NOT NULL DEFAULT 'fr',
    "defaultTargetLanguage" TEXT NOT NULL DEFAULT 'en',
    "showAllLanguages" BOOLEAN NOT NULL DEFAULT false,
    "appearance" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("appearance", "createdAt", "defaultSourceLanguage", "defaultTargetLanguage", "id", "showAllLanguages", "updatedAt") SELECT "appearance", "createdAt", "defaultSourceLanguage", "defaultTargetLanguage", "id", "showAllLanguages", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE TABLE "new_Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "normalizedOriginal" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationLanguage" TEXT NOT NULL,
    "context" TEXT,
    "page" INTEGER,
    "encounterCount" INTEGER NOT NULL DEFAULT 1,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "translationManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastEncounteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Word_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Word" ("bookId", "context", "createdAt", "encounterCount", "favorite", "id", "lastEncounteredAt", "normalizedOriginal", "original", "page", "translation", "translationLanguage", "translationManuallyEdited", "updatedAt") SELECT "bookId", "context", "createdAt", "encounterCount", "favorite", "id", "lastEncounteredAt", "normalizedOriginal", "original", "page", "translation", "translationLanguage", "translationManuallyEdited", "updatedAt" FROM "Word";
DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";
CREATE INDEX "Word_bookId_createdAt_idx" ON "Word"("bookId", "createdAt");
CREATE INDEX "Word_bookId_favorite_idx" ON "Word"("bookId", "favorite");
CREATE UNIQUE INDEX "Word_bookId_normalizedOriginal_key" ON "Word"("bookId", "normalizedOriginal");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

