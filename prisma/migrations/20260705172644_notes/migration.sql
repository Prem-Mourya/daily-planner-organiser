-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" INTEGER NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "isCheckbox" BOOLEAN NOT NULL DEFAULT true,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "NoteItem_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NoteItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
