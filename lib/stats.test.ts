import { describe, it, expect } from "vitest";
import {
  bucketWeekly,
  bucketMonthlyGrid,
  bucketYearly,
  aggregateCategoryOverRange,
  type DayPoint,
} from "./stats";

function p(date: string, total: number, completed: number, percent: number): DayPoint {
  return { date, total, completed, percent };
}

describe("bucketWeekly", () => {
  it("averages daily percents into ISO-week groups", () => {
    // 2026-06-29 (Mon) .. 2026-07-05 (Sun) are all in ISO week 2026-W27.
    // 2026-07-06 (Mon) starts ISO week 2026-W28.
    const points: DayPoint[] = [
      p("2026-06-29", 4, 2, 50),
      p("2026-06-30", 4, 4, 100),
      p("2026-07-05", 4, 0, 0),
      p("2026-07-06", 4, 3, 75),
    ];
    const weeks = bucketWeekly(points);
    expect(weeks).toEqual([
      { week: "2026-W27", percent: 50 }, // avg(50, 100, 0) = 50
      { week: "2026-W28", percent: 75 },
    ]);
  });

  it("returns an empty array for no points", () => {
    expect(bucketWeekly([])).toEqual([]);
  });
});

describe("bucketYearly", () => {
  it("groups points by calendar month and averages percent", () => {
    const points: DayPoint[] = [
      p("2026-01-01", 4, 4, 100),
      p("2026-01-15", 4, 0, 0),
      p("2026-02-01", 4, 2, 50),
    ];
    const months = bucketYearly(points);
    expect(months).toEqual([
      { month: "2026-01", percent: 50 }, // avg(100, 0)
      { month: "2026-02", percent: 50 },
    ]);
  });

  it("returns an empty array for no points", () => {
    expect(bucketYearly([])).toEqual([]);
  });
});

describe("bucketMonthlyGrid", () => {
  it("pads leading nulls so day 1 lands on the correct weekday column (Sunday-first)", () => {
    // July 2026: July 1 is a Wednesday -> Sunday-first index 3.
    // Grid is 0-indexed month (July = 6), matching JS Date.getMonth().
    const points: DayPoint[] = [p("2026-07-01", 4, 4, 100), p("2026-07-02", 4, 2, 50)];
    const grid = bucketMonthlyGrid(points, 2026, 6);

    // 3 leading nulls: Sun, Mon, Tue are blank before Wed (day 1).
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBeNull();
    expect(grid[2]).toBeNull();
    expect(grid[3]).toEqual(p("2026-07-01", 4, 4, 100));
    expect(grid[4]).toEqual(p("2026-07-02", 4, 2, 50));
    // Remaining days of July with no log data are null, not missing.
    expect(grid[5]).toBeNull();
    expect(grid.length).toBe(3 + 31); // 3 leading blanks + 31 days in July
  });

  it("has no leading padding when day 1 falls on Sunday", () => {
    // February 2026: Feb 1 2026 is a Sunday -> Sunday-first index 0.
    const grid = bucketMonthlyGrid([], 2026, 1);
    expect(grid[0]).toBeNull(); // day 1, no log data => null cell, but no extra padding before it
    expect(grid.length).toBe(28); // Feb 2026 has 28 days, 0 leading blanks
  });
});

describe("aggregateCategoryOverRange", () => {
  it("reuses computeCategoryBreakdown across many days' tasks, worst-first", () => {
    const tasks = [
      { isCompleted: false, categoryId: 1, subTasks: [{ isCompleted: true }, { isCompleted: false }] },
      { isCompleted: true, categoryId: 2, subTasks: [] },
      { isCompleted: false, categoryId: 1, subTasks: [] },
    ];
    const buckets = aggregateCategoryOverRange(tasks);
    expect(buckets[0]).toEqual({ categoryId: 1, total: 3, completed: 1, incomplete: 2, percent: 33 });
    expect(buckets[1]).toEqual({ categoryId: 2, total: 1, completed: 1, incomplete: 0, percent: 100 });
  });
});
