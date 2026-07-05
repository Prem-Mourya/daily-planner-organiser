import { computeCategoryBreakdown, leafTotals, type ProgressTask, type CategoryBucket } from "./progress";

export type DayPoint = { date: string; total: number; completed: number; percent: number };

/**
 * Builds daily DayPoints from raw day records: leaf-counts each day's tasks via
 * `leafTotals` (reusing the same leaf-counting rules as `computeProgress`), and
 * takes `percent` directly from the day's stored `progress` (independent of the
 * leaf counts computed here). Pure — no Prisma/DB access.
 */
export function bucketDaily(
  days: { dateKey: string; progress: number; tasks: ProgressTask[] }[]
): DayPoint[] {
  return days.map((day) => {
    const { total, completed } = leafTotals(day.tasks);
    return {
      date: day.dateKey,
      total,
      completed,
      percent: Math.round(day.progress),
    };
  });
}

/**
 * Parses a "YYYY-MM-DD" date-key string into a UTC-anchored Date at midnight.
 * Using UTC avoids local-timezone drift when doing date arithmetic on keys.
 */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Adds `delta` calendar days to a "YYYY-MM-DD" key (UTC-safe), returning a new key. */
function addDaysKey(key: string, delta: number): string {
  const date = parseDateKey(key);
  date.setUTCDate(date.getUTCDate() + delta);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())}`;
}

export type DayStatus = "green" | "yellow" | "red" | "none";

/**
 * Traffic-light status for a day:
 *   green  = every task done (100%)
 *   yellow = at least half done (50%..99%)
 *   red    = under half done (0%..49%), but the day HAD tasks
 *   none   = no tasks tracked that day (or no data) — neutral, not counted
 */
export function classifyDay(point: { total: number; percent: number } | null): DayStatus {
  if (!point || point.total === 0) return "none";
  if (point.percent >= 100) return "green";
  if (point.percent >= 50) return "yellow";
  return "red";
}

/** A day counts toward a streak when it is green or yellow (>= 50% and had tasks). */
function isStreakDay(point: DayPoint): boolean {
  const status = classifyDay(point);
  return status === "green" || status === "yellow";
}

/**
 * Current and longest streaks of consecutive calendar days at >= 50% completion.
 * `current` counts back from today; if today isn't a streak day yet it counts back
 * from yesterday (today is treated as still-in-progress, not a break).
 */
export function computeStreaks(
  points: DayPoint[],
  todayKey: string
): { current: number; longest: number } {
  const streakKeys = new Set(points.filter(isStreakDay).map((pt) => pt.date));

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...streakKeys].sort()) {
    run = prev !== null && addDaysKey(prev, 1) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = key;
  }

  let cursor = streakKeys.has(todayKey) ? todayKey : addDaysKey(todayKey, -1);
  let current = 0;
  while (streakKeys.has(cursor)) {
    current += 1;
    cursor = addDaysKey(cursor, -1);
  }

  return { current, longest };
}

export type TaskRank = { title: string; done: number; total: number; percent: number };

/**
 * Ranks recurring tasks (grouped by title across all history) by completion rate.
 * Each instance is one day the task appeared; `done` means it was fully complete
 * that day. Sorted WORST-FIRST (lowest %, then fewest completions, then title) so
 * the tasks you neglect most surface at the top.
 */
export function rankTasks(instances: { title: string; done: boolean }[]): TaskRank[] {
  const groups = new Map<string, { done: number; total: number }>();
  for (const inst of instances) {
    const cur = groups.get(inst.title) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (inst.done) cur.done += 1;
    groups.set(inst.title, cur);
  }
  return [...groups.entries()]
    .map(([title, { done, total }]) => ({
      title,
      done,
      total,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    }))
    .sort(
      (a, b) => a.percent - b.percent || a.done - b.done || (a.title < b.title ? -1 : 1)
    );
}

/**
 * Calendar-aligned grid for a given month: one entry per day of the month, in order,
 * padded with leading `null`s so day 1 falls in the correct weekday column.
 *
 * Weekday columns are Sunday-first (column 0 = Sunday .. column 6 = Saturday), matching
 * this codebase's `Date.getDay()` / `lib/date.ts` convention. `month` is 0-indexed,
 * matching `Date.getMonth()` (0 = January).
 *
 * Days within the month that have no matching DayPoint are also `null` (not omitted),
 * so the grid always has (leadingBlanks + daysInMonth) entries.
 */
export function bucketMonthlyGrid(
  points: DayPoint[],
  year: number,
  month: number
): (DayPoint | null)[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sunday..6=Saturday

  const grid: (DayPoint | null)[] = new Array(firstWeekday).fill(null);
  const pad = (n: number) => String(n).padStart(2, "0");
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    grid.push(byDate.get(key) ?? null);
  }
  return grid;
}

/** Reuses computeCategoryBreakdown over an arbitrary (potentially multi-day) task list. */
export function aggregateCategoryOverRange(tasks: ProgressTask[]): CategoryBucket[] {
  return computeCategoryBreakdown(tasks);
}
