"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { TaskRow, type TaskViewModel } from "@/components/dashboard/TaskRow";
import { fireConfetti } from "@/lib/confetti";
import { computeProgress } from "@/lib/progress";

export type CategoryOption = { id: number; name: string };

export function TaskList({
  tasks,
  dateKey,
  categories,
}: {
  tasks: TaskViewModel[];
  dateKey: string;
  categories: CategoryOption[];
}) {
  const [editMode, setEditMode] = useState(false);
  const dayProgress = computeProgress(
    tasks.map((t) => ({
      isCompleted: t.isCompleted,
      categoryId: null,
      subTasks: t.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
    }))
  );
  const wasFullyDone = useRef(dayProgress === 100 && tasks.length > 0);

  useEffect(() => {
    const fullyDone = dayProgress === 100 && tasks.length > 0;
    if (fullyDone && !wasFullyDone.current) {
      fireConfetti();
    }
    wasFullyDone.current = fullyDone;
  }, [dayProgress, tasks.length]);

  // Reserved for Task 8 (add/reorder/delete UI); categories/dateKey are
  // threaded through now so that work doesn't need another prop wiring pass.
  void dateKey;
  void categories;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black">Tasks</h2>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className="inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 bg-transparent text-black border border-black/15 hover:bg-black/5"
        >
          {editMode ? "Done Editing" : "Edit Today's Plan"}
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-black/40">
          No tasks for today yet. Add some to your weekly plan to see them here.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
