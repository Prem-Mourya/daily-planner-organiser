import { describe, it, expect } from "vitest";
import { startOfDay, dayOfWeekName, toKey, fromKey } from "./date";

// These assertions use explicit UTC instants and rely on the app's fixed zone
// (Asia/Kolkata, +5:30, no DST), so they hold no matter what timezone the test
// runner (or a production server) is in — that's the whole point of the fix.
describe("date helpers (app timezone = Asia/Kolkata, +5:30)", () => {
  it("dayOfWeekName uses the app timezone, not the server's", () => {
    // 2026-07-05T19:00Z = Mon 2026-07-06 00:30 IST
    expect(dayOfWeekName(new Date("2026-07-05T19:00:00Z"))).toBe("Monday");
    // 2026-07-05T17:00Z = Sun 2026-07-05 22:30 IST
    expect(dayOfWeekName(new Date("2026-07-05T17:00:00Z"))).toBe("Sunday");
  });

  it("toKey returns the app-timezone calendar date", () => {
    expect(toKey(new Date("2026-07-05T19:00:00Z"))).toBe("2026-07-06");
    expect(toKey(new Date("2026-07-05T17:00:00Z"))).toBe("2026-07-05");
  });

  it("startOfDay returns app-timezone midnight as a UTC instant", () => {
    // Any instant on IST Monday 2026-07-06 collapses to 2026-07-05T18:30Z.
    expect(startOfDay(new Date("2026-07-05T19:00:00Z")).toISOString()).toBe(
      "2026-07-05T18:30:00.000Z"
    );
    expect(startOfDay(new Date("2026-07-06T10:00:00Z")).toISOString()).toBe(
      "2026-07-05T18:30:00.000Z"
    );
  });

  it("fromKey inverts toKey (app-timezone midnight)", () => {
    expect(fromKey("2026-07-06").toISOString()).toBe("2026-07-05T18:30:00.000Z");
    expect(toKey(fromKey("2026-07-06"))).toBe("2026-07-06");
  });
});
