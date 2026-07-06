"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { bucketMonthlyGrid, classifyDay, type DayPoint, type DayStatus } from "@/lib/stats";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Traffic-light fills — an intentional exception to the monochrome palette so
// completion status reads at a glance.
const STATUS_FILL: Record<DayStatus, string> = {
  green: "#16a34a",
  yellow: "#eab308",
  red: "#dc2626",
  none: "rgba(0,0,0,0.05)",
};

function cellTextColor(status: DayStatus): string {
  return status === "none" ? "rgba(0,0,0,0.35)" : "#ffffff";
}

function LegendDot({ status, label }: { status: DayStatus; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-[3px]"
        style={{ backgroundColor: STATUS_FILL[status] }}
      />
      <span className="text-xs text-black/50">{label}</span>
    </span>
  );
}

export function StatusCalendar({
  points,
  initialYear,
  initialMonth,
}: {
  points: DayPoint[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 0-indexed

  const grid = bucketMonthlyGrid(points, year, month);
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun; leading blanks

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black/50 transition-colors duration-150 hover:bg-black/5 hover:text-black"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-black/50 transition-colors duration-150 hover:bg-black/5 hover:text-black"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-center text-xs font-medium text-black/30">
            {d}
          </div>
        ))}
        {grid.map((point, i) => {
          // The first `firstWeekday` cells are previous-month padding — leave blank.
          if (i < firstWeekday) return <div key={i} className="aspect-square" />;

          const dayNum = i - firstWeekday + 1;
          const status = classifyDay(point); // null (no data) -> "none" (gray)
          const title = point
            ? `${point.date} — ${point.completed}/${point.total} (${point.percent}%)`
            : "No tasks";
          const cellStyle = {
            backgroundColor: STATUS_FILL[status],
            color: cellTextColor(status),
          };

          if (!point) {
            return (
              <div
                key={i}
                title={title}
                className="flex aspect-square items-center justify-center rounded-md text-xs font-medium"
                style={cellStyle}
              >
                {dayNum}
              </div>
            );
          }

          return (
            <Link
              key={i}
              href={`/stats/${point.date}`}
              title={title}
              className="flex aspect-square items-center justify-center rounded-md text-xs font-medium transition-transform duration-150 hover:scale-105"
              style={cellStyle}
            >
              {dayNum}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <LegendDot status="green" label="All done" />
        <LegendDot status="yellow" label="Half or more" />
        <LegendDot status="red" label="Under half" />
        <LegendDot status="none" label="No tasks" />
      </div>
    </Card>
  );
}
