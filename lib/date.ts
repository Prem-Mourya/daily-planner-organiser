const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function dayOfWeekName(d: Date): string {
  return DAYS[d.getDay()];
}
export function toKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/**
 * Parses a "YYYY-MM-DD" key into a LOCAL-midnight Date. This is the inverse of
 * `toKey` and must be used instead of `new Date(key)` — the latter parses a
 * date-only string as UTC midnight, which drifts to the previous day for users
 * west of UTC and misfiles day-scoped writes.
 */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
