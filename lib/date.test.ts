import { describe, it, expect } from "vitest";
import { startOfDay, dayOfWeekName, toKey, fromKey, formatLongDate } from "./date";

// App timezone defaults to UTC — assertions use plain UTC instants so they
// hold regardless of the machine/host running them.
describe("date helpers (app timezone = UTC)", () => {
  it("dayOfWeekName / toKey / startOfDay agree on the calendar day", () => {
    expect(dayOfWeekName(new Date("2026-07-07T00:00:00Z"))).toBe("Tuesday");
    expect(toKey(new Date("2026-07-07T00:00:00Z"))).toBe("2026-07-07");
    expect(startOfDay(new Date("2026-07-07T10:00:00Z")).toISOString()).toBe(
      "2026-07-07T00:00:00.000Z"
    );
  });

  it("fromKey inverts toKey", () => {
    expect(fromKey("2026-07-07").toISOString()).toBe("2026-07-07T00:00:00.000Z");
    expect(toKey(fromKey("2026-07-07"))).toBe("2026-07-07");
  });

  it("formatLongDate's weekday always matches dayOfWeekName for the same instant — regression guard for the header showing the wrong day near a UTC boundary", () => {
    const instant = new Date("2026-07-07T00:00:00Z");
    const label = formatLongDate(instant);
    expect(label.startsWith(dayOfWeekName(instant))).toBe(true);
    expect(label).toBe("Tuesday, July 7");
  });
});
