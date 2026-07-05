"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateDailyLog, recomputeAndSaveProgress } from "@/lib/queries";
import { fromKey } from "@/lib/date";

export async function toggleTask(taskId: number, checked: boolean): Promise<void> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: checked },
    select: { dailyLogId: true },
  });
  await prisma.subTask.updateMany({ where: { taskId }, data: { isCompleted: checked } });
  await recomputeAndSaveProgress(task.dailyLogId);
  revalidatePath("/");
}

export async function toggleSubTask(subTaskId: number, checked: boolean): Promise<void> {
  const sub = await prisma.subTask.update({
    where: { id: subTaskId },
    data: { isCompleted: checked },
    select: { taskId: true, task: { select: { dailyLogId: true } } },
  });
  const siblings = await prisma.subTask.findMany({ where: { taskId: sub.taskId } });
  const allDone = siblings.length > 0 && siblings.every((s) => s.isCompleted);
  await prisma.task.update({ where: { id: sub.taskId }, data: { isCompleted: allDone } });
  await recomputeAndSaveProgress(sub.task.dailyLogId);
  revalidatePath("/");
}

export async function addTask(
  dateKey: string,
  title: string,
  categoryId: number | null
): Promise<void> {
  const dailyLogId = await getOrCreateDailyLog(fromKey(dateKey));
  const count = await prisma.task.count({ where: { dailyLogId } });
  await prisma.task.create({
    data: {
      dailyLogId,
      title,
      categoryId,
      order: count,
    },
  });
  await recomputeAndSaveProgress(dailyLogId);
  revalidatePath("/");
}

export async function addSubTask(taskId: number, title: string): Promise<void> {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { dailyLogId: true },
  });
  const count = await prisma.subTask.count({ where: { taskId } });
  await prisma.subTask.create({
    data: {
      taskId,
      title,
      order: count,
    },
  });
  // A freshly created subtask always starts incomplete, so the parent can
  // never honestly remain complete — demote it to keep the parent/child
  // invariant intact (mirrors toggleSubTask/deleteSubTask).
  await prisma.task.update({ where: { id: taskId }, data: { isCompleted: false } });
  await recomputeAndSaveProgress(task.dailyLogId);
  revalidatePath("/");
}

export async function updateTask(
  taskId: number,
  data: { title?: string; categoryId?: number | null }
): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    },
  });
  revalidatePath("/");
}

export async function updateSubTask(subTaskId: number, title: string): Promise<void> {
  await prisma.subTask.update({
    where: { id: subTaskId },
    data: { title },
  });
  revalidatePath("/");
}

export async function deleteTask(taskId: number): Promise<void> {
  const task = await prisma.task.delete({
    where: { id: taskId },
    select: { dailyLogId: true },
  });
  await recomputeAndSaveProgress(task.dailyLogId);
  revalidatePath("/");
}

export async function deleteSubTask(subTaskId: number): Promise<void> {
  const sub = await prisma.subTask.delete({
    where: { id: subTaskId },
    select: { taskId: true, task: { select: { dailyLogId: true } } },
  });
  const siblings = await prisma.subTask.findMany({ where: { taskId: sub.taskId } });
  const allDone = siblings.length > 0 && siblings.every((s) => s.isCompleted);
  await prisma.task.update({ where: { id: sub.taskId }, data: { isCompleted: allDone } });
  await recomputeAndSaveProgress(sub.task.dailyLogId);
  revalidatePath("/");
}

export async function reorderTasks(orderedIds: number[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/");
}

export async function reorderSubTasks(orderedIds: number[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.subTask.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/");
}
