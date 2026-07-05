"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { StoredItem } from "@/lib/notes";

export async function createNote(): Promise<number> {
  const note = await prisma.note.create({ data: { title: "Untitled" } });
  revalidatePath("/notes");
  return note.id;
}

export async function renameNote(id: number, title: string): Promise<void> {
  await prisma.note.update({
    where: { id },
    data: { title: title.trim() === "" ? "Untitled" : title },
  });
  revalidatePath("/notes");
}

export async function deleteNote(id: number): Promise<void> {
  await prisma.note.delete({ where: { id } }); // items cascade
  revalidatePath("/notes");
}

/**
 * Replaces a note's outline with `items` (pre-order, so parents precede
 * children). Upserts everything supplied and deletes anything no longer
 * present, atomically. Touches the note's updatedAt so the list reorders.
 */
export async function saveNoteItems(noteId: number, items: StoredItem[]): Promise<void> {
  const existing = await prisma.noteItem.findMany({
    where: { noteId },
    select: { id: true },
  });
  const keep = new Set(items.map((i) => i.id));
  const toDelete = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);

  await prisma.$transaction([
    ...(toDelete.length
      ? [prisma.noteItem.deleteMany({ where: { id: { in: toDelete } } })]
      : []),
    ...items.map((item) =>
      prisma.noteItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          noteId,
          parentId: item.parentId,
          content: item.content,
          isCheckbox: item.isCheckbox,
          isChecked: item.isChecked,
          order: item.order,
        },
        update: {
          parentId: item.parentId,
          content: item.content,
          isCheckbox: item.isCheckbox,
          isChecked: item.isChecked,
          order: item.order,
        },
      })
    ),
    prisma.note.update({ where: { id: noteId }, data: { updatedAt: new Date() } }),
  ]);

  revalidatePath("/notes");
}
