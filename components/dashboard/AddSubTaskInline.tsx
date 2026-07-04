"use client";

import { useState, useTransition } from "react";
import { addSubTask } from "@/app/actions/tasks";

export function AddSubTaskInline({ taskId }: { taskId: number }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addSubTask(taskId, trimmed);
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
