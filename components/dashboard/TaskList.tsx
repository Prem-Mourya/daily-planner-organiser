"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, Reorder } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { TaskRow, type TaskViewModel } from "@/components/dashboard/TaskRow";
import { AddTaskInline } from "@/components/dashboard/AddTaskInline";
import { reorderTasks } from "@/app/actions/tasks";
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
  const [order, setOrder] = useState<TaskViewModel[]>(tasks);
  const [, startTransition] = useTransition();
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

  // Resync local order state whenever the server-provided task list changes
  // (e.g. after add/delete/toggle revalidation).
  useEffect(() => {
    setOrder(tasks);
  }, [tasks]);

  function handleReorder(next: TaskViewModel[]) {
    setOrder(next);
    startTransition(async () => {
      await reorderTasks(next.map((t) => t.id));
    });
  }

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

      {order.length === 0 && !editMode ? (
        <p className="mt-4 text-sm text-black/40">
          No tasks for today yet. Add some to your weekly plan to see them here.
        </p>
      ) : editMode ? (
        <Reorder.Group
          as="ul"
          axis="y"
          values={order}
          onReorder={handleReorder}
          className="mt-2 flex flex-col"
        >
          <AnimatePresence initial={false}>
            {order.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                editMode={editMode}
                categories={categories}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <ul className="mt-2 flex flex-col">
          <AnimatePresence initial={false}>
            {order.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                editMode={editMode}
                categories={categories}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {editMode ? (
        <AddTaskInline dateKey={dateKey} categories={categories} />
      ) : null}
    </Card>
  );
}
