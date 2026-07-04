"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { updateSubTask, deleteSubTask } from "@/app/actions/tasks";
import type { SubTaskViewModel } from "@/components/dashboard/TaskRow";

export function SubTaskRow({
  subTask,
  disabled,
  editMode = false,
  onToggle,
}: {
  subTask: SubTaskViewModel;
  disabled: boolean;
  editMode?: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(subTask.title);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!isEditingTitle) setTitleDraft(subTask.title);
  }, [subTask.title, isEditingTitle]);

  function commitTitle() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === subTask.title) {
      setTitleDraft(subTask.title);
      return;
    }
    startTransition(() => {
      updateSubTask(subTask.id, trimmed);
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteSubTask(subTask.id);
    });
  }

  const isDisabled = disabled || isPending;

  const content = (
    <div
      className="flex items-center gap-3 py-1.5 pl-9 transition-opacity duration-150"
      style={{ opacity: isDisabled && !editMode ? 0.5 : 1, pointerEvents: isDisabled && !editMode ? "none" : "auto" }}
    >
      {editMode ? (
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => dragControls.start(e)}
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-black/25 active:cursor-grabbing"
        >
          ⠿
        </button>
      ) : null}

      <Checkbox checked={subTask.isCompleted} onChange={onToggle} size="sm" />

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
          className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm text-black/70 outline-none transition-colors duration-150 hover:border-black/10 focus:border-black/30"
        />
      ) : (
        <span className="relative text-sm text-black/70">
          {subTask.title}
          <motion.span
            aria-hidden
            className="absolute left-0 top-1/2 h-px bg-black/40"
            initial={false}
            animate={{ width: subTask.isCompleted ? "100%" : "0%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </span>
      )}

      {editMode ? (
        <button
          type="button"
          aria-label="Delete subtask"
          onClick={handleDelete}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black/35 transition-colors duration-150 hover:bg-black/5 hover:text-black/70"
        >
          ✕
        </button>
      ) : null}
    </div>
  );

  if (editMode) {
    return (
      <Reorder.Item
        as="div"
        value={subTask}
        dragListener={false}
        dragControls={dragControls}
        className="bg-white"
      >
        {content}
      </Reorder.Item>
    );
  }

  return content;
}
