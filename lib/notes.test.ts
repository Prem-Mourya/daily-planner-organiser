import { describe, it, expect } from "vitest";
import { toOutline, toStored, noteProgress, type StoredItem, type OutlineItem } from "./notes";

const s = (
  id: string,
  parentId: string | null,
  order: number,
  extra: Partial<StoredItem> = {}
): StoredItem => ({
  id,
  parentId,
  order,
  content: extra.content ?? id,
  isCheckbox: extra.isCheckbox ?? true,
  isChecked: extra.isChecked ?? false,
});

const o = (id: string, depth: number, extra: Partial<OutlineItem> = {}): OutlineItem => ({
  id,
  depth,
  content: extra.content ?? id,
  isCheckbox: extra.isCheckbox ?? true,
  isChecked: extra.isChecked ?? false,
});

describe("toOutline", () => {
  it("flattens a tree into pre-order with depth, respecting sibling order", () => {
    // A (root,0) -> B (child,0); C (root,1)
    const items = [s("B", "A", 0), s("C", null, 1), s("A", null, 0)];
    const outline = toOutline(items).map((x) => [x.id, x.depth]);
    expect(outline).toEqual([
      ["A", 0],
      ["B", 1],
      ["C", 0],
    ]);
  });
});

describe("toStored", () => {
  it("derives parentId (nearest shallower line) and sibling order from depth", () => {
    const outline = [o("A", 0), o("B", 1), o("C", 1), o("D", 0)];
    const stored = toStored(outline).map((x) => [x.id, x.parentId, x.order]);
    expect(stored).toEqual([
      ["A", null, 0],
      ["B", "A", 0],
      ["C", "A", 1],
      ["D", null, 1],
    ]);
  });

  it("round-trips with toOutline", () => {
    const outline = [o("A", 0), o("B", 1), o("E", 2), o("C", 1), o("D", 0)];
    expect(toOutline(toStored(outline)).map((x) => [x.id, x.depth])).toEqual(
      outline.map((x) => [x.id, x.depth])
    );
  });
});

describe("noteProgress", () => {
  it("counts only checkbox items", () => {
    const items = [
      { isCheckbox: false, isChecked: false }, // heading
      { isCheckbox: true, isChecked: true },
      { isCheckbox: true, isChecked: false },
      { isCheckbox: true, isChecked: true },
    ];
    expect(noteProgress(items)).toEqual({ done: 2, total: 3, percent: 67 });
  });

  it("is 0/0/0 with no checkboxes", () => {
    expect(noteProgress([{ isCheckbox: false, isChecked: false }])).toEqual({
      done: 0,
      total: 0,
      percent: 0,
    });
  });
});
