import Link from "next/link";
import { notFound } from "next/navigation";
import { getDayIfExists, getCategories } from "@/lib/queries";
import { fromKey } from "@/lib/date";
import { computeProgress, computeCategoryBreakdown, type ProgressTask } from "@/lib/progress";
import { ProgressHeader } from "@/components/dashboard/ProgressHeader";
import { CategorySummary } from "@/components/dashboard/CategorySummary";
import { TaskList } from "@/components/dashboard/TaskList";
import type { TaskViewModel } from "@/components/dashboard/TaskRow";
import { Card } from "@/components/ui/Card";

// Reads a specific past/future day's live data — render per request.
export const dynamic = "force-dynamic";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function StatsDayPage({ params }: { params: { date: string } }) {
  if (!DATE_KEY_RE.test(params.date)) notFound();

  const targetDate = fromKey(params.date);
  const [day, categories] = await Promise.all([getDayIfExists(targetDate), getCategories()]);
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  if (!day) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 py-8">
        <Link href="/stats" className="text-sm text-black/50 transition-colors hover:text-black">
          ← Stats
        </Link>
        <Card>
          <p className="text-sm text-black/40">No data logged for {params.date}.</p>
        </Card>
      </main>
    );
  }

  const progressTasks: ProgressTask[] = day.tasks.map((task) => ({
    isCompleted: task.isCompleted,
    categoryId: task.categoryId,
    subTasks: task.subTasks.map((sub) => ({ isCompleted: sub.isCompleted })),
  }));

  const progress = computeProgress(progressTasks);
  const breakdown = computeCategoryBreakdown(progressTasks);
  const totalLeaves = breakdown.reduce((sum, b) => sum + b.total, 0);
  const completedLeaves = breakdown.reduce((sum, b) => sum + b.completed, 0);

  const taskViewModels: TaskViewModel[] = day.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    isCompleted: task.isCompleted,
    categoryId: task.categoryId,
    categoryName: task.category?.name ?? null,
    subTasks: task.subTasks.map((sub) => ({
      id: sub.id,
      title: sub.title,
      isCompleted: sub.isCompleted,
    })),
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <Link href="/stats" className="text-sm text-black/50 transition-colors hover:text-black">
        ← Stats
      </Link>
      <ProgressHeader
        date={targetDate}
        progress={progress}
        completedLeaves={completedLeaves}
        totalLeaves={totalLeaves}
        emptyLabel="No tasks logged this day"
      />
      <CategorySummary breakdown={breakdown} categories={categoryOptions} />
      <TaskList tasks={taskViewModels} dateKey={params.date} categories={categoryOptions} />
    </main>
  );
}
