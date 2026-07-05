import { describe, it, expect } from "vitest";
import { computeProgress, computeCategoryBreakdown, taskIsComplete, leafTotals } from "./progress";

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

  it("ignores a with-children parent's own isCompleted flag", () => {
    // parent flag true but only 1 of 2 subtasks done => 50%, not 100%
    expect(computeProgress([t(true, 1, [true, false])])).toBe(50);
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

describe("leafTotals", () => {
  it("sums leaves across mixed childless and subtasked tasks", () => {
    // childless done (1/1) + childless not done (0/1) + 2 subtasks 1 done (1/2)
    const tasks = [t(true, 1), t(false, 2), t(false, 3, [true, false])];
    expect(leafTotals(tasks)).toEqual({ total: 4, completed: 2 });
  });

  it("returns zeroes for no tasks", () => {
    expect(leafTotals([])).toEqual({ total: 0, completed: 0 });
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

  it("puts uncategorized (null) tasks in their own bucket", () => {
    const b = computeCategoryBreakdown([t(true, null), t(false, null)]);
    expect(b).toEqual([{ categoryId: null, total: 2, completed: 1, incomplete: 1, percent: 50 }]);
  });

  it("breaks incomplete ties by percent ascending (weaker % first)", () => {
    // both categories have incomplete=1; cat 2 at 50% ranks before cat 1 at 75%
    const tasks = [t(false, 1, [true, true, true, false]), t(false, 2, [true, false])];
    const b = computeCategoryBreakdown(tasks);
    expect(b[0]).toEqual({ categoryId: 2, total: 2, completed: 1, incomplete: 1, percent: 50 });
    expect(b[1]).toEqual({ categoryId: 1, total: 4, completed: 3, incomplete: 1, percent: 75 });
  });
});
