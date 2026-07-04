import { describe, it, expect } from "vitest";
import { startOfDay, dayOfWeekName, toKey } from "./date";

describe("date helpers", () => {
  it("startOfDay zeroes the time", () => {
    const d = startOfDay(new Date(2026, 6, 5, 14, 30));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
  it("dayOfWeekName maps Sunday 2026-07-05", () => {
    expect(dayOfWeekName(new Date(2026, 6, 5))).toBe("Sunday");
  });
  it("toKey formats YYYY-MM-DD", () => {
    expect(toKey(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
});
