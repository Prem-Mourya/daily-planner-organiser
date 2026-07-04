import { getDay, getCategories } from "@/lib/queries";
import { computeProgress, computeCategoryBreakdown, type ProgressTask } from "@/lib/progress";
import { toKey } from "@/lib/date";
import { ProgressHeader } from "@/components/dashboard/ProgressHeader";
import { CategorySummary } from "@/components/dashboard/CategorySummary";
import { TaskList } from "@/components/dashboard/TaskList";
import type { TaskViewModel } from "@/components/dashboard/TaskRow";

export default async function Home() {
  const today = new Date();
  const day = await getDay(today);
  const categories = await getCategories();

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
    categoryName: task.category?.name ?? null,
    subTasks: task.subTasks.map((sub) => ({
      id: sub.id,
      title: sub.title,
      isCompleted: sub.isCompleted,
    })),
  }));

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <main className="flex flex-col gap-6 py-8">
      <ProgressHeader
        date={today}
        progress={progress}
        completedLeaves={completedLeaves}
        totalLeaves={totalLeaves}
      />
      <CategorySummary breakdown={breakdown} categories={categoryOptions} />
      <TaskList
        tasks={taskViewModels}
        dateKey={toKey(today)}
        categories={categoryOptions}
      />
    </main>
  );
}
