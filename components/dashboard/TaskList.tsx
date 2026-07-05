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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  // A task is expandable when it shows a chevron: it has subtasks, or we're in
  // edit mode (where every row can reveal its add-subtask input).
  const expandableIds = order
    .filter((t) => t.subTasks.length > 0 || editMode)
    .map((t) => t.id);
  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id));

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(expandableIds));
  }
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-black">Tasks</h2>
        <div className="flex shrink-0 items-center gap-2">
          {expandableIds.length > 0 ? (
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-full border border-black/15 px-3 py-2 text-sm font-medium text-black/60 transition-colors duration-150 hover:bg-black/5"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-black/15 bg-transparent px-4 py-2 text-sm font-medium text-black transition-colors duration-150 hover:bg-black/5"
          >
            {editMode ? "Done Editing" : "Edit Today's Plan"}
          </button>
        </div>
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
                expanded={expandedIds.has(task.id)}
                onToggleExpand={() => toggleExpand(task.id)}
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
                expanded={expandedIds.has(task.id)}
                onToggleExpand={() => toggleExpand(task.id)}
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
