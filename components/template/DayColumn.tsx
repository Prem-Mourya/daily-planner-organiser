"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { CategoryPicker } from "@/components/dashboard/CategoryPicker";
import type { CategoryOption } from "@/components/dashboard/TaskList";
import {
  updateTemplateTask,
  deleteTemplateTask,
  addTemplateTask,
  addTemplateSubTask,
  updateTemplateSubTask,
  deleteTemplateSubTask,
  reorderTemplateTasks,
  reorderTemplateSubTasks,
} from "@/app/actions/template";

export type TemplateSubTaskViewModel = {
  id: number;
  title: string;
};

export type TemplateTaskViewModel = {
  id: number;
  title: string;
  categoryId: number | null;
  categoryName: string | null;
  subTasks: TemplateSubTaskViewModel[];
};

function TemplateSubTaskRow({
  subTask,
  disabled,
}: {
  subTask: TemplateSubTaskViewModel;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(subTask.title);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!isEditing) setTitleDraft(subTask.title);
  }, [subTask.title, isEditing]);

  function commitTitle() {
    setIsEditing(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === subTask.title) {
      setTitleDraft(subTask.title);
      return;
    }
    startTransition(() => {
      updateTemplateSubTask(subTask.id, trimmed);
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteTemplateSubTask(subTask.id);
    });
  }

  const isDisabled = disabled || isPending;

  return (
    <Reorder.Item
      as="div"
      value={subTask}
      dragListener={false}
      dragControls={dragControls}
      className="bg-white"
    >
      <div
        className="flex items-center gap-3 py-1.5 pl-9 transition-opacity duration-150"
        style={{ opacity: isDisabled ? 0.6 : 1 }}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => dragControls.start(e)}
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-black/25 active:cursor-grabbing"
        >
          ⠿
        </button>

        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm text-black/70 outline-none transition-colors duration-150 hover:border-black/10 focus:border-black/30"
        />

        <button
          type="button"
          aria-label="Delete subtask"
          onClick={handleDelete}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black/35 transition-colors duration-150 hover:bg-black/5 hover:text-black/70"
        >
          ✕
        </button>
      </div>
    </Reorder.Item>
  );
}

function AddTemplateSubTaskInline({ templateTaskId }: { templateTaskId: number }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addTemplateSubTask(templateTaskId, trimmed);
    });
    setTitle("");
  }

  return (
    <div className="flex items-center gap-2 py-1.5 pl-9">
      <input
        type="text"
        value={title}
        placeholder="+ add subtask"
        disabled={isPending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm text-black/60 outline-none transition-colors duration-150 placeholder:text-black/30 hover:border-black/10 focus:border-black/30 disabled:opacity-40"
      />
      <button
        type="button"
        disabled={isPending || !title.trim()}
        onClick={(e) => {
          e.stopPropagation();
          submit();
        }}
        className="shrink-0 rounded-full border border-black/15 px-2.5 py-1 text-xs font-medium text-black/60 transition-colors duration-150 hover:bg-black/5 disabled:opacity-40"
      >
        Add
      </button>
    </div>
  );
}

function TemplateTaskRow({
  task,
  categories,
}: {
  task: TemplateTaskViewModel;
  categories: CategoryOption[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [subOrder, setSubOrder] = useState(task.subTasks);
  const dragControls = useDragControls();

  useEffect(() => {
    setSubOrder(task.subTasks);
  }, [task.subTasks]);

  useEffect(() => {
    if (!isEditingTitle) setTitleDraft(task.title);
  }, [task.title, isEditingTitle]);

  const hasSubTasks = task.subTasks.length > 0;

  function commitTitle() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title);
      return;
    }
    startTransition(() => {
      updateTemplateTask(task.id, { title: trimmed });
    });
  }

  function handleCategoryChange(categoryId: number | null) {
    startTransition(() => {
      updateTemplateTask(task.id, { categoryId });
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteTemplateTask(task.id);
    });
  }

  function handleSubReorder(next: typeof subOrder) {
    setSubOrder(next);
    startTransition(async () => {
      await reorderTemplateSubTasks(next.map((s) => s.id));
    });
  }

  return (
    <Reorder.Item
      as="li"
      value={task}
      dragListener={false}
      dragControls={dragControls}
      className="border-b border-black/5 last:border-b-0 bg-white"
    >
      <div
        className="flex items-center gap-3 py-3 transition-opacity duration-150"
        style={{ opacity: isPending ? 0.6 : 1 }}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => dragControls.start(e)}
          className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-black/30 active:cursor-grabbing"
        >
          ⠿
        </button>

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

        <CategoryPicker
          categories={categories}
          value={task.categoryId}
          onChange={handleCategoryChange}
          disabled={isPending}
        />

        <button
          type="button"
          aria-label="Delete task"
          onClick={handleDelete}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors duration-150 hover:bg-black/5 hover:text-black/70"
        >
          ✕
        </button>

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
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {hasSubTasks ? (
              <Reorder.Group
                as="div"
                axis="y"
                values={subOrder}
                onReorder={handleSubReorder}
                className="flex flex-col pb-2"
              >
                {subOrder.map((sub) => (
                  <TemplateSubTaskRow key={sub.id} subTask={sub} disabled={isPending} />
                ))}
              </Reorder.Group>
            ) : null}
            <AddTemplateSubTaskInline templateTaskId={task.id} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function AddTemplateTaskInline({
  dayOfWeek,
  categories,
}: {
  dayOfWeek: string;
  categories: CategoryOption[];
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addTemplateTask(dayOfWeek, trimmed, categoryId);
    });
    setTitle("");
    setCategoryId(null);
  }

  return (
    <div className="flex items-center gap-2 pt-3">
      <div className="h-6 w-4 shrink-0" />
      <input
        type="text"
        value={title}
        placeholder="Add a task…"
        disabled={isPending}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="flex-1 rounded-lg border border-black/10 bg-transparent px-2.5 py-1.5 text-sm text-black outline-none placeholder:text-black/30 focus:border-black/30 disabled:opacity-40"
      />
      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        disabled={isPending}
      />
      <button
        type="button"
        disabled={isPending || !title.trim()}
        onClick={submit}
        className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-150 hover:bg-black/5 disabled:opacity-40"
      >
        + Add
      </button>
    </div>
  );
}

export function DayColumn({
  dayOfWeek,
  tasks,
  categories,
}: {
  dayOfWeek: string;
  tasks: TemplateTaskViewModel[];
  categories: CategoryOption[];
}) {
  const [order, setOrder] = useState<TemplateTaskViewModel[]>(tasks);
  const [, startTransition] = useTransition();

  // Resync local order state whenever the server-provided task list changes
  // (e.g. after add/delete/reorder revalidation), avoiding Reorder staleness.
  useEffect(() => {
    setOrder(tasks);
  }, [tasks]);

  function handleReorder(next: TemplateTaskViewModel[]) {
    setOrder(next);
    startTransition(async () => {
      await reorderTemplateTasks(next.map((t) => t.id));
    });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-black">{dayOfWeek}</h2>

      {order.length === 0 ? (
        <p className="mt-4 text-sm text-black/40">No tasks yet for {dayOfWeek}.</p>
      ) : (
        <Reorder.Group
          as="ul"
          axis="y"
          values={order}
          onReorder={handleReorder}
          className="mt-2 flex flex-col"
        >
          <AnimatePresence initial={false}>
            {order.map((task) => (
              <TemplateTaskRow key={task.id} task={task} categories={categories} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <AddTemplateTaskInline dayOfWeek={dayOfWeek} categories={categories} />
    </Card>
  );
}
