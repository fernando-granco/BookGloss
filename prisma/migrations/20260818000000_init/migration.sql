-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "secondaryLanguage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "normalizedOriginal" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationLanguage" TEXT NOT NULL,
    "secondaryLanguage" TEXT,
    "context" TEXT,
    "page" INTEGER,
    "encounterCount" INTEGER NOT NULL DEFAULT 1,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastEncounteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Word_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "defaultSourceLanguage" TEXT NOT NULL DEFAULT 'fr',
    "defaultTargetLanguage" TEXT NOT NULL DEFAULT 'en',
    "enabledLanguages" TEXT NOT NULL DEFAULT 'pt,en,fr,es',
    "appearance" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Word_bookId_createdAt_idx" ON "Word"("bookId", "createdAt");

-- CreateIndex
CREATE INDEX "Word_bookId_favorite_idx" ON "Word"("bookId", "favorite");

-- CreateIndex
CREATE UNIQUE INDEX "Word_bookId_normalizedOriginal_key" ON "Word"("bookId", "normalizedOriginal");

-- CreateIndex
CREATE INDEX "WordTranslation_wordId_createdAt_idx" ON "WordTranslation"("wordId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WordTranslation_wordId_targetLanguage_key" ON "WordTranslation"("wordId", "targetLanguage");

