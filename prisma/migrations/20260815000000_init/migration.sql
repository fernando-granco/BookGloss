-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "defaultSourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "defaultTargetLanguage" TEXT NOT NULL DEFAULT 'pt',
    "appearance" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "Word_bookId_createdAt_idx" ON "Word"("bookId", "createdAt");
CREATE INDEX "Word_bookId_favorite_idx" ON "Word"("bookId", "favorite");
CREATE UNIQUE INDEX "Word_bookId_normalizedOriginal_key" ON "Word"("bookId", "normalizedOriginal");
