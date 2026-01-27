-- CreateTable
CREATE TABLE "story_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "themes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "builder_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "builder_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "story_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "logline" TEXT NOT NULL,
    "desire" TEXT NOT NULL,
    "fear" TEXT NOT NULL,
    "wound" TEXT NOT NULL,
    "contradiction" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "relationships" TEXT NOT NULL,
    "arc" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "characters_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "story_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plot_beats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "stakes" TEXT NOT NULL,
    "turn" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "plot_beats_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "story_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "bullets" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "research_notes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "story_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
