"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addTemplateTask(
  dayOfWeek: string,
  title: string,
  categoryId: number | null
): Promise<void> {
  const template = await prisma.weeklyTemplate.findUniqueOrThrow({
    where: { dayOfWeek },
    select: { id: true },
  });
  const count = await prisma.templateTask.count({ where: { templateId: template.id } });
  await prisma.templateTask.create({
    data: {
      templateId: template.id,
      title,
      categoryId,
      order: count,
    },
  });
  revalidatePath("/template");
}

export async function updateTemplateTask(
  id: number,
  data: { title?: string; categoryId?: number | null }
): Promise<void> {
  await prisma.templateTask.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    },
  });
  revalidatePath("/template");
}

export async function deleteTemplateTask(id: number): Promise<void> {
  await prisma.templateTask.delete({ where: { id } });
  revalidatePath("/template");
}

export async function addTemplateSubTask(templateTaskId: number, title: string): Promise<void> {
  const count = await prisma.templateSubTask.count({ where: { templateTaskId } });
  await prisma.templateSubTask.create({
    data: {
      templateTaskId,
      title,
      order: count,
    },
  });
  revalidatePath("/template");
}

export async function updateTemplateSubTask(id: number, title: string): Promise<void> {
  await prisma.templateSubTask.update({
    where: { id },
    data: { title },
  });
  revalidatePath("/template");
}

export async function deleteTemplateSubTask(id: number): Promise<void> {
  await prisma.templateSubTask.delete({ where: { id } });
  revalidatePath("/template");
}

export async function resetTemplateDay(dayOfWeek: string): Promise<void> {
  const template = await prisma.weeklyTemplate.findUniqueOrThrow({
    where: { dayOfWeek },
    select: { id: true },
  });
  // Deletes every task for this weekday; subtasks cascade via the schema.
  await prisma.templateTask.deleteMany({ where: { templateId: template.id } });
  revalidatePath("/template");
}

export async function reorderTemplateTasks(orderedIds: number[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.templateTask.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/template");
}

export async function reorderTemplateSubTasks(orderedIds: number[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.templateSubTask.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/template");
}
