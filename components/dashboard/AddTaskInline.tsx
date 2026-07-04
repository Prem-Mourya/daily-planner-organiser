"use client";

import { useState, useTransition } from "react";
import { CategoryPicker } from "@/components/dashboard/CategoryPicker";
import { addTask } from "@/app/actions/tasks";
import type { CategoryOption } from "@/components/dashboard/TaskList";

export function AddTaskInline({
  dateKey,
  categories,
}: {
  dateKey: string;
  categories: CategoryOption[];
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addTask(dateKey, trimmed, categoryId);
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
        placeholder="Add a task for today…"
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
