import { describe, it, expect } from "vitest";
import { startOfDay, dayOfWeekName, toKey, fromKey } from "./date";

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
  it("fromKey parses to LOCAL midnight (round-trips with toKey, no UTC drift)", () => {
    const d = fromKey("2026-07-05");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July (0-indexed)
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(0);
    // round-trip: toKey(fromKey(k)) === k regardless of timezone
    expect(toKey(fromKey("2026-07-05"))).toBe("2026-07-05");
    // and it agrees with startOfDay's local-getter convention
    expect(toKey(startOfDay(fromKey("2026-07-05")))).toBe("2026-07-05");
  });
});
