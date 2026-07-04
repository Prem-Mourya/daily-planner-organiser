import "server-only";
import { prisma } from "./db";
import { startOfDay, dayOfWeekName } from "./date";
import { computeProgress } from "./progress";

export async function getOrCreateDailyLog(date: Date): Promise<number> {
  const day = startOfDay(date);
  const existing = await prisma.dailyLog.findUnique({ where: { date: day } });
  if (existing) return existing.id;

  const template = await prisma.weeklyTemplate.findUnique({
    where: { dayOfWeek: dayOfWeekName(day) },
    include: { tasks: { include: { subTasks: true }, orderBy: { order: "asc" } } },
  });

  const log = await prisma.dailyLog.create({ data: { date: day, progress: 0 } });

  if (template) {
    for (const tt of template.tasks) {
      await prisma.task.create({
        data: {
          dailyLogId: log.id,
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
  return log.id;
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
