"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { SubTaskRow } from "@/components/dashboard/SubTaskRow";
import { CategoryPicker } from "@/components/dashboard/CategoryPicker";
import { AddSubTaskInline } from "@/components/dashboard/AddSubTaskInline";
import type { CategoryOption } from "@/components/dashboard/TaskList";
import {
  toggleTask,
  toggleSubTask,
  updateTask,
  deleteTask,
  reorderSubTasks,
} from "@/app/actions/tasks";
import { taskIsComplete } from "@/lib/progress";
import { fireConfetti } from "@/lib/confetti";

export type SubTaskViewModel = {
  id: number;
  title: string;
  isCompleted: boolean;
};

export type TaskViewModel = {
  id: number;
  title: string;
  isCompleted: boolean;
  categoryId: number | null;
  categoryName: string | null;
  subTasks: SubTaskViewModel[];
};

export function TaskRow({
  task,
  editMode = false,
  categories = [],
}: {
  task: TaskViewModel;
  editMode?: boolean;
  categories?: CategoryOption[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [subOrder, setSubOrder] = useState(task.subTasks);
  const dragControls = useDragControls();
  const wasComplete = useRef(
    taskIsComplete({
      isCompleted: task.isCompleted,
      categoryId: null,
      subTasks: task.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
    })
  );

  const complete = taskIsComplete({
    isCompleted: task.isCompleted,
    categoryId: null,
    subTasks: task.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
  });

  useEffect(() => {
    if (complete && !wasComplete.current) {
      fireConfetti();
    }
    wasComplete.current = complete;
  }, [complete]);

  useEffect(() => {
    setSubOrder(task.subTasks);
  }, [task.subTasks]);

  useEffect(() => {
    if (!isEditingTitle) setTitleDraft(task.title);
  }, [task.title, isEditingTitle]);

  const hasSubTasks = task.subTasks.length > 0;

  function handleToggleTask() {
    const next = !task.isCompleted;
    startTransition(() => {
      toggleTask(task.id, next);
    });
  }

  function handleToggleSubTask(subTaskId: number, checked: boolean) {
    startTransition(() => {
      toggleSubTask(subTaskId, checked);
    });
  }

  function commitTitle() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title);
      return;
    }
    startTransition(() => {
      updateTask(task.id, { title: trimmed });
    });
  }

  function handleCategoryChange(categoryId: number | null) {
    startTransition(() => {
      updateTask(task.id, { categoryId });
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteTask(task.id);
    });
  }

  function handleSubReorder(next: typeof subOrder) {
    setSubOrder(next);
    startTransition(async () => {
      await reorderSubTasks(next.map((s) => s.id));
    });
  }

  const rowContent = (
    <>
      <div
        className="flex items-center gap-3 py-3 transition-opacity duration-150"
        style={{ opacity: isPending ? 0.6 : 1 }}
      >
        {editMode ? (
          <button
            type="button"
            aria-label="Drag to reorder"
            onPointerDown={(e) => dragControls.start(e)}
            className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-black/30 active:cursor-grabbing"
          >
            ⠿
          </button>
        ) : null}

        <Checkbox checked={task.isCompleted} onChange={handleToggleTask} />

        {editMode ? (
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onFocus={() => setIsEditingTitle(true)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-black outline-none transition-colors duration-150 hover:border-black/10 focus:border-black/30"
          />
        ) : (
          <button
            type="button"
            className="flex flex-1 items-center justify-between gap-2 text-left"
            onClick={() => hasSubTasks && setExpanded((v) => !v)}
          >
            <span className="relative text-sm font-medium text-black">
              {task.title}
              <motion.span
                aria-hidden
                className="absolute left-0 top-1/2 h-px bg-black/50"
                initial={false}
                animate={{ width: complete ? "100%" : "0%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </span>
            {task.categoryName ? (
              <span className="shrink-0 text-xs text-black/35">{task.categoryName}</span>
            ) : null}
          </button>
        )}

        {editMode ? (
          <CategoryPicker
            categories={categories}
            value={task.categoryId}
            onChange={handleCategoryChange}
            disabled={isPending}
          />
        ) : null}

        {editMode ? (
          <button
            type="button"
            aria-label="Delete task"
            onClick={handleDelete}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors duration-150 hover:bg-black/5 hover:text-black/70"
          >
            ✕
          </button>
        ) : null}

        {hasSubTasks || editMode ? (
          <motion.button
            type="button"
            aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
            onClick={() => setExpanded((v) => !v)}
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-black/40"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        ) : (
          <div className="h-6 w-6 shrink-0" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {(hasSubTasks || editMode) && expanded ? (
          <motion.div
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {editMode ? (
              <Reorder.Group
                as="div"
                axis="y"
                values={subOrder}
                onReorder={handleSubReorder}
                className="flex flex-col pb-2"
              >
                {subOrder.map((sub) => (
                  <SubTaskRow
                    key={sub.id}
                    subTask={sub}
                    disabled={isPending}
                    editMode
                    onToggle={() => handleToggleSubTask(sub.id, !sub.isCompleted)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className="flex flex-col pb-2">
                {task.subTasks.map((sub) => (
                  <SubTaskRow
                    key={sub.id}
                    subTask={sub}
                    disabled={isPending}
                    onToggle={() => handleToggleSubTask(sub.id, !sub.isCompleted)}
                  />
                ))}
              </div>
            )}
            {editMode ? <AddSubTaskInline taskId={task.id} /> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );

  if (editMode) {
    return (
      <Reorder.Item
        as="li"
        value={task}
        dragListener={false}
        dragControls={dragControls}
        className="border-b border-black/5 last:border-b-0 bg-white"
      >
        {rowContent}
      </Reorder.Item>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-b border-black/5 last:border-b-0"
    >
      {rowContent}
    </motion.li>
  );
}
