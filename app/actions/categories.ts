"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addCategory(name: string): Promise<void> {
  const count = await prisma.category.count();
  await prisma.category.create({
    data: { name, order: count },
  });
  revalidatePath("/template");
  revalidatePath("/");
}

export async function renameCategory(id: number, name: string): Promise<void> {
  await prisma.category.update({
    where: { id },
    data: { name },
  });
  revalidatePath("/template");
  revalidatePath("/");
}

export async function deleteCategory(id: number): Promise<void> {
  // Referencing TemplateTask/Task rows become Uncategorized automatically via
  // the schema's `onDelete: SetNull` on Category relations — no manual nulling.
  await prisma.category.delete({ where: { id } });
  revalidatePath("/template");
  revalidatePath("/");
}

export async function reorderCategories(orderedIds: number[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/template");
  revalidatePath("/");
}
