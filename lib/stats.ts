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

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

/**
 * ISO-8601 week key ("YYYY-Www") for a date-key string.
 * ISO weeks start Monday and week 1 is the week containing the year's first Thursday.
 */
function isoWeekKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // shift to nearest Thursday
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Groups daily points into ISO-week buckets, averaging percent. Sorted chronologically. */
export function bucketWeekly(points: DayPoint[]): { week: string; percent: number }[] {
  const groups = new Map<string, number[]>();
  for (const point of points) {
    const key = isoWeekKey(point.date);
    const list = groups.get(key) ?? [];
    list.push(point.percent);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([week, percents]) => ({ week, percent: average(percents) }));
}

/** Groups daily points by calendar month ("YYYY-MM"), averaging percent. Sorted chronologically. */
export function bucketYearly(points: DayPoint[]): { month: string; percent: number }[] {
  const groups = new Map<string, number[]>();
  for (const point of points) {
    const key = point.date.slice(0, 7); // "YYYY-MM"
    const list = groups.get(key) ?? [];
    list.push(point.percent);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, percents]) => ({ month, percent: average(percents) }));
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
