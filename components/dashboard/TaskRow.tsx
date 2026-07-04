"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { SubTaskRow } from "@/components/dashboard/SubTaskRow";
import { toggleTask, toggleSubTask } from "@/app/actions/tasks";
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
  categoryName: string | null;
  subTasks: SubTaskViewModel[];
};

export function TaskRow({ task }: { task: TaskViewModel }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
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

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-b border-black/5 last:border-b-0"
    >
      <div
        className="flex items-center gap-3 py-3 transition-opacity duration-150"
        style={{ opacity: isPending ? 0.6 : 1 }}
      >
        <Checkbox checked={task.isCompleted} onChange={handleToggleTask} />

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

        {hasSubTasks ? (
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
        {hasSubTasks && expanded ? (
          <motion.div
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pb-2">
              {task.subTasks.map((sub) => (
                <SubTaskRow
                  key={sub.id}
                  title={sub.title}
                  checked={sub.isCompleted}
                  disabled={isPending}
                  onToggle={() => handleToggleSubTask(sub.id, !sub.isCompleted)}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}
