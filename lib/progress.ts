export type ProgressTask = {
  isCompleted: boolean;
  categoryId: number | null;
  subTasks: { isCompleted: boolean }[];
};

export type CategoryBucket = {
  categoryId: number | null;
  total: number;
  completed: number;
  incomplete: number;
  percent: number;
};

function leafCounts(task: ProgressTask): { total: number; completed: number } {
  if (task.subTasks.length === 0) {
    return { total: 1, completed: task.isCompleted ? 1 : 0 };
  }
  return {
    total: task.subTasks.length,
    completed: task.subTasks.filter((s) => s.isCompleted).length,
  };
}

export function taskIsComplete(task: ProgressTask): boolean {
  const { total, completed } = leafCounts(task);
  return total === completed;
}

export function computeProgress(tasks: ProgressTask[]): number {
  let total = 0, completed = 0;
  for (const task of tasks) {
    const c = leafCounts(task);
    total += c.total; completed += c.completed;
  }
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function computeCategoryBreakdown(tasks: ProgressTask[]): CategoryBucket[] {
  const map = new Map<number | null, { total: number; completed: number }>();
  for (const task of tasks) {
    const c = leafCounts(task);
    const cur = map.get(task.categoryId) ?? { total: 0, completed: 0 };
    cur.total += c.total; cur.completed += c.completed;
    map.set(task.categoryId, cur);
  }
  const buckets: CategoryBucket[] = [...map.entries()].map(([categoryId, c]) => ({
    categoryId,
    total: c.total,
    completed: c.completed,
    incomplete: c.total - c.completed,
    percent: c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100),
  }));
  return buckets.sort((a, b) => b.incomplete - a.incomplete || a.percent - b.percent);
}
