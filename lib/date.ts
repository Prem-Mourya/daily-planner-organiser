// "Which day is it" logic runs in a FIXED timezone (default Asia/Kolkata), NOT
// the server's. A UTC host like Vercel/AWS Lambda (which won't let you set the
// TZ env var — it's reserved) would otherwise compute "today" and the weekday
// hours behind you. Override the zone with APP_TIMEZONE if you relocate.

const APP_TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: APP_TZ, weekday: "long" });

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsInAppTz(instant: Date): Parts {
  const map: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(instant)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === "24" ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

// The UTC instant that is midnight of a given app-timezone calendar day.
function zonedMidnightUtc(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  const p = partsInAppTz(new Date(guess));
  // Offset (ms) of APP_TZ from UTC: (its wall clock read as UTC) − the instant.
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - guess;
  return new Date(guess - offset);
}

/** Midnight of the app-timezone day containing `instant`, as a UTC instant. */
export function startOfDay(instant: Date): Date {
  const { year, month, day } = partsInAppTz(instant);
  return zonedMidnightUtc(year, month, day);
}

/** Weekday name ("Monday".."Sunday") in the app timezone. */
export function dayOfWeekName(instant: Date): string {
  return weekdayFmt.format(instant);
}

/** "YYYY-MM-DD" for the app-timezone calendar day of `instant`. */
export function toKey(instant: Date): string {
  const { year, month, day } = partsInAppTz(instant);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(day)}`;
}

/** Inverse of `toKey`: the UTC instant of app-timezone midnight for that key. */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return zonedMidnightUtc(y, m, d);
}
