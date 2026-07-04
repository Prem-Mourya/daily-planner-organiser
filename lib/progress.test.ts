import { describe, it, expect } from "vitest";
import { computeProgress, computeCategoryBreakdown, taskIsComplete } from "./progress";

const t = (isCompleted: boolean, categoryId: number | null, subs: boolean[] = []) => ({
  isCompleted, categoryId, subTasks: subs.map((c) => ({ isCompleted: c })),
});

describe("computeProgress", () => {
  it("returns 0 for no tasks", () => expect(computeProgress([])).toBe(0));

  it("counts a childless completed parent as one done leaf", () => {
    expect(computeProgress([t(true, 1)])).toBe(100);
    expect(computeProgress([t(false, 1)])).toBe(0);
  });

  it("weights a parent by its subtasks, not as an extra unit", () => {
    // Studies: 2 subtasks, 1 done + Vitamins: childless, done => 2/3
    const tasks = [t(false, 1, [true, false]), t(true, 2)];
    expect(computeProgress(tasks)).toBe(67);
  });
});

describe("taskIsComplete", () => {
  it("childless: mirrors isCompleted", () => {
    expect(taskIsComplete(t(true, 1))).toBe(true);
    expect(taskIsComplete(t(false, 1))).toBe(false);
  });
  it("with children: true only when all subtasks complete", () => {
    expect(taskIsComplete(t(false, 1, [true, true]))).toBe(true);
    expect(taskIsComplete(t(true, 1, [true, false]))).toBe(false);
  });
});

describe("computeCategoryBreakdown", () => {
  it("groups leaves by parent category and ranks worst-first", () => {
    const tasks = [
      t(false, 1, [true, false]), // cat 1: 2 leaves, 1 done
      t(true, 2),                 // cat 2: 1 leaf, 1 done
      t(false, 1),                // cat 1: 1 leaf, 0 done
    ];
    const b = computeCategoryBreakdown(tasks);
    expect(b[0]).toEqual({ categoryId: 1, total: 3, completed: 1, incomplete: 2, percent: 33 });
    expect(b[1]).toEqual({ categoryId: 2, total: 1, completed: 1, incomplete: 0, percent: 100 });
  });
});
