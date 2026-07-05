"use client";

import { useState } from "react";
import { DayColumn, type TemplateTaskViewModel } from "@/components/template/DayColumn";
import type { CategoryOption } from "@/components/dashboard/TaskList";

export type DayData = { dayOfWeek: string; tasks: TemplateTaskViewModel[] };

export function DayBoard({
  days,
  categories,
}: {
  days: DayData[];
  categories: CategoryOption[];
}) {
  // Which day's tasks are "on the clipboard". Kept after a paste so you can
  // paste the same day onto several others.
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {days.map((day) => (
        <DayColumn
          key={day.dayOfWeek}
          dayOfWeek={day.dayOfWeek}
          tasks={day.tasks}
          categories={categories}
          copiedFrom={copiedFrom}
          onCopy={setCopiedFrom}
        />
      ))}
    </div>
  );
}
