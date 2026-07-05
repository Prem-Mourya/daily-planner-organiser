"use client";

import { useState } from "react";
import { bucketMonthlyGrid, type DayPoint } from "@/lib/stats";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Gray ramp: higher percent -> darker cell. 0/empty -> lightest gray. */
function cellColor(percent: number | null): string {
  if (percent === null) return "#f0f0f0";
  if (percent === 0) return "#e5e5e5";
  if (percent < 25) return "#c7c7c7";
  if (percent < 50) return "#a3a3a3";
  if (percent < 75) return "#737373";
  if (percent < 100) return "#525252";
  return "#171717";
}

export function MonthlyGrid({
  points,
  initialYear,
  initialMonth,
}: {
  points: DayPoint[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const grid = bucketMonthlyGrid(points, year, month);

  function shiftMonth(delta: number) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-full px-2 py-1 text-sm text-black/50 hover:bg-black/5 hover:text-black"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <span className="text-sm font-medium text-black">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-full px-2 py-1 text-sm text-black/50 hover:bg-black/5 hover:text-black"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] uppercase text-black/30">
            {label}
          </div>
        ))}
        {grid.map((cell, i) => {
          const dayNumber = cell ? Number(cell.date.slice(8, 10)) : null;
          return (
            <div
              key={i}
              title={
                cell
                  ? `${cell.date}: ${cell.percent}% (${cell.completed}/${cell.total})`
                  : undefined
              }
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[10px]",
                cell ? "text-white/80" : "text-transparent"
              )}
              style={{ backgroundColor: cellColor(cell ? cell.percent : null) }}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
}
