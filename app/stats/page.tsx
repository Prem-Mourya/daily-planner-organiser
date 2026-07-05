import { prisma } from "@/lib/db";
import { toKey } from "@/lib/date";
import type { ProgressTask } from "@/lib/progress";
import { bucketDaily } from "@/lib/stats";
import { StatsTabs } from "@/components/stats/StatsTabs";

export default async function StatsPage() {
  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: "asc" },
    include: {
      tasks: {
        include: { subTasks: true, category: true },
      },
    },
  });

  const points = bucketDaily(
    logs.map((log) => ({
      dateKey: toKey(log.date),
      progress: log.progress,
      tasks: log.tasks.map((task) => ({
        isCompleted: task.isCompleted,
        categoryId: task.categoryId,
        subTasks: task.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
      })),
    }))
  );

  const rangeTasks: ProgressTask[] = logs.flatMap((log) =>
    log.tasks.map((task) => ({
      isCompleted: task.isCompleted,
      categoryId: task.categoryId,
      subTasks: task.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
    }))
  );

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const now = new Date();

  return (
    <main className="flex flex-col gap-6 py-8">
      <h1 className="text-lg font-semibold text-black">Stats</h1>
      <StatsTabs
        points={points}
        rangeTasks={rangeTasks}
        categories={categoryOptions}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
    </main>
  );
}
