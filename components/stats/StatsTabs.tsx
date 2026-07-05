"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { DayPoint } from "@/lib/stats";
import type { ProgressTask } from "@/lib/progress";
import { DailyChart } from "@/components/stats/DailyChart";
import { WeeklyChart } from "@/components/stats/WeeklyChart";
import { YearlyChart } from "@/components/stats/YearlyChart";
import { MonthlyGrid } from "@/components/stats/MonthlyGrid";
import { CategoryBreakdownPanel, type CategoryLookup } from "@/components/stats/CategoryBreakdownPanel";

const TABS = ["Daily", "Weekly", "Monthly", "Yearly"] as const;
type Tab = (typeof TABS)[number];

export function StatsTabs({
  points,
  rangeTasks,
  categories,
  initialYear,
  initialMonth,
}: {
  points: DayPoint[];
  rangeTasks: ProgressTask[];
  categories: CategoryLookup;
  initialYear: number;
  initialMonth: number;
}) {
  const [tab, setTab] = useState<Tab>("Daily");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors duration-150",
                tab === t
                  ? "bg-black text-white"
                  : "text-black/50 hover:bg-black/5 hover:text-black"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Daily" && <DailyChart points={points} />}
        {tab === "Weekly" && <WeeklyChart points={points} />}
        {tab === "Monthly" && (
          <MonthlyGrid points={points} initialYear={initialYear} initialMonth={initialMonth} />
        )}
        {tab === "Yearly" && <YearlyChart points={points} />}
      </Card>

      <CategoryBreakdownPanel rangeTasks={rangeTasks} categories={categories} />
    </div>
  );
}
