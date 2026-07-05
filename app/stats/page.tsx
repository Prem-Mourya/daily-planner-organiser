import { prisma } from "@/lib/db";
import { toKey } from "@/lib/date";
import { taskIsComplete, type ProgressTask } from "@/lib/progress";
import { bucketDaily, computeStreaks, rankTasks } from "@/lib/stats";
import { StreakHeader } from "@/components/stats/StreakHeader";
import { StatusCalendar } from "@/components/stats/StatusCalendar";
import { TaskRanking } from "@/components/stats/TaskRanking";
import { CategoryBreakdownPanel } from "@/components/stats/CategoryBreakdownPanel";

// Reads live DB history — render per request, not at build time.
export const dynamic = "force-dynamic";

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

  // One instance per (day, task); `done` = the task was fully complete that day.
  const taskInstances = logs.flatMap((log) =>
    log.tasks.map((task) => ({
      title: task.title,
      done: taskIsComplete({
        isCompleted: task.isCompleted,
        categoryId: task.categoryId,
        subTasks: task.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
      }),
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
  const streaks = computeStreaks(points, toKey(now));
  const ranks = rankTasks(taskInstances);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <h1 className="text-lg font-semibold text-black">Stats</h1>
      <StreakHeader current={streaks.current} longest={streaks.longest} />
      <StatusCalendar
        points={points}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
      <TaskRanking ranks={ranks} />
      <CategoryBreakdownPanel rangeTasks={rangeTasks} categories={categoryOptions} />
    </main>
  );
}
