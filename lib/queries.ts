import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { startOfDay, dayOfWeekName } from "./date";
import { computeProgress } from "./progress";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Copies the weekday template's tasks/subtasks into a day's instance rows.
 * Caller guarantees the day is currently empty (and holds a lock on it — see
 * getOrCreateDailyLog), so this never duplicates.
 */
async function copyTemplateIntoDay(tx: Tx, dailyLogId: number, day: Date): Promise<void> {
  const template = await tx.weeklyTemplate.findUnique({
    where: { dayOfWeek: dayOfWeekName(day) },
    include: { tasks: { include: { subTasks: true }, orderBy: { order: "asc" } } },
  });
  if (!template || template.tasks.length === 0) return;

  // Bulk insert in 2 round trips total (not N) — a sequential per-task loop
  // over Neon's network latency is what caused the earlier timeout. Postgres
  // createManyAndReturn gives us the generated task ids in the same insert.
  const createdTasks = await tx.task.createManyAndReturn({
    data: template.tasks.map((tt) => ({
      dailyLogId,
      categoryId: tt.categoryId,
      title: tt.title,
      order: tt.order,
    })),
  });
  // template.tasks and createdTasks are both in the same insert order.
  const subTaskRows = template.tasks.flatMap((tt, i) =>
    tt.subTasks
      .sort((a, b) => a.order - b.order)
      .map((st) => ({ taskId: createdTasks[i].id, title: st.title, order: st.order }))
  );
  if (subTaskRows.length > 0) {
    await tx.subTask.createMany({ data: subTaskRows });
  }
}

export async function getOrCreateDailyLog(date: Date): Promise<number> {
  const day = startOfDay(date);
  const existing = await prisma.dailyLog.findUnique({ where: { date: day }, select: { id: true } });

  if (existing) {
    // Auto-fill an EMPTY day from its weekday template. `FOR UPDATE` locks the
    // row for the transaction's duration, so a second concurrent request for
    // the same day blocks until the first commits, then sees a non-zero task
    // count and skips — otherwise both would race past the empty check and
    // double-copy the template (this is what happened before the lock).
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT id FROM "DailyLog" WHERE id = ${existing.id} FOR UPDATE`;
        const count = await tx.task.count({ where: { dailyLogId: existing.id } });
        if (count === 0) {
          await copyTemplateIntoDay(tx, existing.id, day);
        }
      },
      // The copy loop is N sequential network round trips (one create per
      // template task); over Neon that alone can take 10-15s+ for a template
      // with many tasks, so give it real headroom — this only runs once, the
      // first time an empty day is materialized.
      { timeout: 30000, maxWait: 15000 }
    );
    return existing.id;
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const log = await tx.dailyLog.create({ data: { date: day, progress: 0 } });
        await copyTemplateIntoDay(tx, log.id, day);
        return log.id;
      },
      { timeout: 30000, maxWait: 15000 }
    );
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

/**
 * Fetches a day's log by exact date WITHOUT materializing it from the weekly
 * template — for read/inspect views (e.g. the stats calendar drill-down) of a
 * day that may be in the past or future. Returns null if no log exists yet.
 */
export async function getDayIfExists(date: Date) {
  const day = startOfDay(date);
  const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  const include = {
    tasks: {
      orderBy: { order: "asc" as const },
      include: { subTasks: { orderBy: { order: "asc" as const } }, category: true },
    },
  };
  // Range, not exact equality: logs created before the app's fixed timezone
  // was introduced/changed aren't necessarily stored at a clean midnight
  // instant, so an exact match can silently miss real data for that day. A
  // calendar day can also hold more than one such legacy row — prefer one
  // that actually has tasks over an empty leftover.
  const withTasks = await prisma.dailyLog.findFirst({
    where: { date: { gte: day, lt: nextDay }, tasks: { some: {} } },
    include,
  });
  if (withTasks) return withTasks;
  return prisma.dailyLog.findFirst({ where: { date: { gte: day, lt: nextDay } }, include });
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
