import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { startOfDay, dayOfWeekName } from "./date";
import { computeProgress } from "./progress";

/**
 * Copies the weekday template's tasks/subtasks into a day's instance rows.
 * Caller guarantees the day is currently empty, so this never duplicates.
 */
async function copyTemplateIntoDay(dailyLogId: number, day: Date): Promise<void> {
  const template = await prisma.weeklyTemplate.findUnique({
    where: { dayOfWeek: dayOfWeekName(day) },
    include: { tasks: { include: { subTasks: true }, orderBy: { order: "asc" } } },
  });
  if (!template) return;

  for (const tt of template.tasks) {
    await prisma.task.create({
      data: {
        dailyLogId,
        categoryId: tt.categoryId,
        title: tt.title,
        order: tt.order,
        subTasks: {
          create: tt.subTasks
            .sort((a, b) => a.order - b.order)
            .map((st) => ({ title: st.title, order: st.order })),
        },
      },
    });
  }
}

export async function getOrCreateDailyLog(date: Date): Promise<number> {
  const day = startOfDay(date);
  const existing = await prisma.dailyLog.findUnique({
    where: { date: day },
    include: { _count: { select: { tasks: true } } },
  });

  if (existing) {
    // Auto-fill an EMPTY day from its weekday template. A day is only ever
    // materialized while it has zero tasks, so this can never clobber user
    // edits — but it lets a plan authored after the (empty) day was first
    // opened still show up. Tradeoff: clearing all of a day's tasks and
    // reopening re-pulls the template.
    if (existing._count.tasks === 0) {
      await copyTemplateIntoDay(existing.id, day);
    }
    return existing.id;
  }

  try {
    const log = await prisma.dailyLog.create({ data: { date: day, progress: 0 } });
    await copyTemplateIntoDay(log.id, day);
    return log.id;
  } catch (err) {
    // A concurrent first-open of the same day may have created it between our
    // findUnique and create — the unique `date` constraint (P2002) protects the
    // data; just re-fetch the winner's row instead of failing.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await prisma.dailyLog.findUniqueOrThrow({ where: { date: day } });
      return winner.id;
    }
    throw err;
  }
}

export async function getDay(date: Date) {
  const id = await getOrCreateDailyLog(date);
  return prisma.dailyLog.findUniqueOrThrow({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: { subTasks: { orderBy: { order: "asc" } }, category: true },
      },
    },
  });
}

export function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

/** Notes for the list view (most-recently-edited first), with items for progress + search. */
export function getNotes() {
  return prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      items: { select: { content: true, isCheckbox: true, isChecked: true } },
    },
  });
}

/** A single note with its full item set (for the editor). */
export function getNote(id: number) {
  return prisma.note.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          id: true,
          parentId: true,
          content: true,
          isCheckbox: true,
          isChecked: true,
          order: true,
        },
      },
    },
  });
}

export async function recomputeAndSaveProgress(dailyLogId: number): Promise<number> {
  const log = await prisma.dailyLog.findUniqueOrThrow({
    where: { id: dailyLogId },
    include: { tasks: { include: { subTasks: true } } },
  });
  const progress = computeProgress(
    log.tasks.map((t) => ({
      isCompleted: t.isCompleted,
      categoryId: t.categoryId,
      subTasks: t.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
    }))
  );
  await prisma.dailyLog.update({ where: { id: dailyLogId }, data: { progress } });
  return progress;
}
