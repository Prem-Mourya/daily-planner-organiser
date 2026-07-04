"use client";

import type { CategoryOption } from "@/components/dashboard/TaskList";

export function CategoryPicker({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: CategoryOption[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value === null ? "" : String(value)}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
      className="shrink-0 rounded-full border border-black/15 bg-transparent px-2.5 py-1 text-xs text-black/60 outline-none transition-colors duration-150 hover:bg-black/5 disabled:opacity-40"
    >
      <option value="">Uncategorized</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
