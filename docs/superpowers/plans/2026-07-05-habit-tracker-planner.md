# Habit Tracker & Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monochrome-minimalist habit tracker & daily/weekly planner: a recurring weekly template that materializes independent, editable daily instances with hierarchical (parent/child) tasks, category-grouped progress analytics, and premium micro-interactions.

**Architecture:** Next.js App Router with Server Components for reads and Server Actions for all mutations (no REST layer). Prisma + SQLite for storage with fully separate Template and Instance tables. Days are lazily materialized from the weekday template on first open, then fully independent. All progress/category math lives in pure, unit-tested functions shared by dashboard and stats.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, canvas-confetti, Prisma, SQLite, Recharts, Vitest (unit tests).

## Global Constraints

- **Palette:** strictly white / black / gray family only. One accent = pure black on white surfaces. No colored hues anywhere (including charts and confetti — confetti is grayscale).
- **Notifications (Feature E) are OUT OF SCOPE** for this plan.
- **Single-user, local app.** No auth, no cloud sync, no deployment concerns.
- **Template vs. Instance rule (invariant):** editing a day never mutates any template row; editing a template never mutates any already-materialized day.
- **Progress algorithm (invariant):** a *leaf* = a subtask OR a parent with no children. `progress% = completedLeaves / totalLeaves * 100`; 0 leaves → 0%.
- **Category rule:** category lives on the parent task only; subtasks inherit; `categoryId` is nullable → "Uncategorized" bucket.
- **Dates are date-only** (no time component); "today" is the local calendar day.
- Prisma client is imported from a single shared singleton (`lib/db.ts`) — never `new PrismaClient()` elsewhere.

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `vitest.config.ts`, `.gitignore`
- Create: `lib/db.ts`

**Interfaces:**
- Produces: `lib/db.ts` exporting `prisma` (a `PrismaClient` singleton). Consumed by every later data task.

- [ ] **Step 1: Scaffold the Next.js app in-place**

Run from the project root (dir already exists and is a git repo):
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```
Expected: files generated; `app/`, `tailwind.config.ts`, `package.json` present.

- [ ] **Step 2: Add project dependencies**

```bash
npm install framer-motion canvas-confetti recharts @prisma/client
npm install -D prisma vitest @vitejs/plugin-react vite-tsconfig-paths @types/canvas-confetti
```
Expected: installs succeed.

- [ ] **Step 3: Create the Prisma client singleton**

Create `lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["**/*.test.ts"] },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 5: Verify the app builds and dev server starts**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Prisma, Vitest, deps"
```

---

### Task 2: Prisma schema, migration & seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Modify: `package.json` (add `prisma.seed` + `db:seed` script)
- Modify: `.gitignore` (ignore `*.db`, `*.db-journal`)

**Interfaces:**
- Produces: Prisma models `Category`, `WeeklyTemplate`, `TemplateTask`, `TemplateSubTask`, `DailyLog`, `Task`, `SubTask` with the exact fields below. Consumed by all data tasks.

- [ ] **Step 1: Write the schema**

Create `prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = "file:./dev.db" }

model Category {
  id            Int            @id @default(autoincrement())
  name          String         @unique
  order         Int            @default(0)
  createdAt     DateTime       @default(now())
  templateTasks TemplateTask[]
  tasks         Task[]
}

model WeeklyTemplate {
  id        Int            @id @default(autoincrement())
  dayOfWeek String         @unique // "Monday".."Sunday"
  createdAt DateTime       @default(now())
  tasks     TemplateTask[]
}

model TemplateTask {
  id         Int               @id @default(autoincrement())
  templateId Int
  template   WeeklyTemplate    @relation(fields: [templateId], references: [id], onDelete: Cascade)
  categoryId Int?
  category   Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  title      String
  order      Int               @default(0)
  subTasks   TemplateSubTask[]
}

model TemplateSubTask {
  id             Int          @id @default(autoincrement())
  templateTaskId Int
  templateTask   TemplateTask @relation(fields: [templateTaskId], references: [id], onDelete: Cascade)
  title          String
  order          Int          @default(0)
}

model DailyLog {
  id       Int      @id @default(autoincrement())
  date     DateTime @unique // stored at 00:00:00 local, date-only semantics
  progress Float    @default(0)
  tasks    Task[]
}

model Task {
  id         Int       @id @default(autoincrement())
  dailyLogId Int
  dailyLog   DailyLog  @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)
  categoryId Int?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  title      String
  isCompleted Boolean  @default(false)
  order      Int       @default(0)
  subTasks   SubTask[]
}

model SubTask {
  id          Int     @id @default(autoincrement())
  taskId      Int
  task        Task    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  title       String
  isCompleted Boolean @default(false)
  order       Int     @default(0)
}
```

- [ ] **Step 2: Ignore the SQLite db files**

Append to `.gitignore`:
```
*.db
*.db-journal
prisma/dev.db*
```

- [ ] **Step 3: Create migration & generate client**

Run: `npx prisma migrate dev --name init`
Expected: migration created under `prisma/migrations/`, client generated.

- [ ] **Step 4: Write the seed (categories + a starter template)**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const CATEGORIES = ["Health","Self Care","Study","Work"];

async function main() {
  for (let i = 0; i < CATEGORIES.length; i++) {
    await prisma.category.upsert({
      where: { name: CATEGORIES[i] },
      update: {},
      create: { name: CATEGORIES[i], order: i },
    });
  }
  for (const day of DAYS) {
    await prisma.weeklyTemplate.upsert({
      where: { dayOfWeek: day },
      update: {},
      create: { dayOfWeek: day },
    });
  }
}
main().finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
"prisma": { "seed": "npx tsx prisma/seed.ts" },
```
Add script `"db:seed": "npx tsx prisma/seed.ts"` and install tsx: `npm i -D tsx`.

- [ ] **Step 5: Run the seed**

Run: `npm run db:seed`
Expected: 4 categories + 7 weekday templates created (idempotent).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: prisma schema, init migration, category+template seed"
```

---

### Task 3: Core progress & category logic (pure, TDD)

**Files:**
- Create: `lib/progress.ts`
- Test: `lib/progress.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions over plain shapes).
- Produces:
  - `type LeafTask = { isCompleted: boolean }`
  - `type ProgressTask = { isCompleted: boolean; categoryId: number | null; subTasks: { isCompleted: boolean }[] }`
  - `computeProgress(tasks: ProgressTask[]): number` — returns 0–100, rounded.
  - `type CategoryBucket = { categoryId: number | null; total: number; completed: number; incomplete: number; percent: number }`
  - `computeCategoryBreakdown(tasks: ProgressTask[]): CategoryBucket[]` — sorted by `incomplete` desc, then `percent` asc.
  - `taskIsComplete(task: ProgressTask): boolean` — true if a childless task is completed, or all its subtasks are completed.

- [ ] **Step 1: Write the failing tests**

Create `lib/progress.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module `./progress` has no such exports.

- [ ] **Step 3: Implement the logic**

Create `lib/progress.ts`:
```ts
export type ProgressTask = {
  isCompleted: boolean;
  categoryId: number | null;
  subTasks: { isCompleted: boolean }[];
};

export type CategoryBucket = {
  categoryId: number | null;
  total: number;
  completed: number;
  incomplete: number;
  percent: number;
};

function leafCounts(task: ProgressTask): { total: number; completed: number } {
  if (task.subTasks.length === 0) {
    return { total: 1, completed: task.isCompleted ? 1 : 0 };
  }
  return {
    total: task.subTasks.length,
    completed: task.subTasks.filter((s) => s.isCompleted).length,
  };
}

export function taskIsComplete(task: ProgressTask): boolean {
  const { total, completed } = leafCounts(task);
  return total === completed;
}

export function computeProgress(tasks: ProgressTask[]): number {
  let total = 0, completed = 0;
  for (const task of tasks) {
    const c = leafCounts(task);
    total += c.total; completed += c.completed;
  }
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function computeCategoryBreakdown(tasks: ProgressTask[]): CategoryBucket[] {
  const map = new Map<number | null, { total: number; completed: number }>();
  for (const task of tasks) {
    const c = leafCounts(task);
    const cur = map.get(task.categoryId) ?? { total: 0, completed: 0 };
    cur.total += c.total; cur.completed += c.completed;
    map.set(task.categoryId, cur);
  }
  const buckets: CategoryBucket[] = [...map.entries()].map(([categoryId, c]) => ({
    categoryId,
    total: c.total,
    completed: c.completed,
    incomplete: c.total - c.completed,
    percent: c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100),
  }));
  return buckets.sort((a, b) => b.incomplete - a.incomplete || a.percent - b.percent);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/progress.ts lib/progress.test.ts && git commit -m "feat: pure progress & category-breakdown logic with tests"
```

---

### Task 4: Data layer — day materialization & queries (TDD where pure)

**Files:**
- Create: `lib/date.ts`, `lib/date.test.ts`
- Create: `lib/queries.ts` (server-only data access)

**Interfaces:**
- Consumes: `prisma` from `lib/db.ts`; `computeProgress` from `lib/progress.ts`.
- Produces:
  - `lib/date.ts`: `startOfDay(d: Date): Date` (local midnight), `dayOfWeekName(d: Date): string` ("Monday".."Sunday"), `toKey(d: Date): string` ("YYYY-MM-DD").
  - `lib/queries.ts`:
    - `getOrCreateDailyLog(date: Date): Promise<number>` — returns `dailyLogId`, materializing from the weekday template on first call for that date.
    - `getDay(date: Date)` — returns `{ id, date, progress, tasks: (Task & { subTasks: SubTask[]; category: Category | null })[] }` ordered by `order`.
    - `getCategories(): Promise<Category[]>` ordered by `order`.
    - `recomputeAndSaveProgress(dailyLogId: number): Promise<number>` — recomputes from DB rows, persists to `DailyLog.progress`, returns the %.

- [ ] **Step 1: Write failing date tests**

Create `lib/date.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test lib/date.test.ts`
Expected: FAIL — `./date` not found.

- [ ] **Step 3: Implement date helpers**

Create `lib/date.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test lib/date.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the query layer**

Create `lib/queries.ts`:
```ts
import "server-only";
import { prisma } from "./db";
import { startOfDay, dayOfWeekName } from "./date";
import { computeProgress } from "./progress";

export async function getOrCreateDailyLog(date: Date): Promise<number> {
  const day = startOfDay(date);
  const existing = await prisma.dailyLog.findUnique({ where: { date: day } });
  if (existing) return existing.id;

  const template = await prisma.weeklyTemplate.findUnique({
    where: { dayOfWeek: dayOfWeekName(day) },
    include: { tasks: { include: { subTasks: true }, orderBy: { order: "asc" } } },
  });

  const log = await prisma.dailyLog.create({ data: { date: day, progress: 0 } });

  if (template) {
    for (const tt of template.tasks) {
      await prisma.task.create({
        data: {
          dailyLogId: log.id,
          categoryId: tt.categoryId,
          title: tt.title,
          order: tt.order,
          subTasks: {
            create: tt.subTasks
              .sort((a, b) => a.order - b.order)
              .map((st) => ({ title: st.title, order: st.order })),
          },
        },
      });
    }
  }
  return log.id;
}

export async function getDay(date: Date) {
  const id = await getOrCreateDailyLog(date);
  return prisma.dailyLog.findUniqueOrThrow({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: { subTasks: { orderBy: { order: "asc" } }, category: true },
      },
    },
  });
}

export function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

export async function recomputeAndSaveProgress(dailyLogId: number): Promise<number> {
  const log = await prisma.dailyLog.findUniqueOrThrow({
    where: { id: dailyLogId },
    include: { tasks: { include: { subTasks: true } } },
  });
  const progress = computeProgress(
    log.tasks.map((t) => ({
      isCompleted: t.isCompleted,
      categoryId: t.categoryId,
      subTasks: t.subTasks.map((s) => ({ isCompleted: s.isCompleted })),
    }))
  );
  await prisma.dailyLog.update({ where: { id: dailyLogId }, data: { progress } });
  return progress;
}
```

Install the `server-only` guard: `npm i server-only`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: date helpers (tested) and day-materialization query layer"
```

---

### Task 5: Design system tokens & base UI primitives

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`
- Create: `components/ui/Card.tsx`, `components/ui/Checkbox.tsx`, `components/ui/ProgressRing.tsx`, `components/ui/Button.tsx`
- Create: `components/Nav.tsx`

**Interfaces:**
- Produces:
  - `Card` — glass card wrapper: `({ className?, children })`.
  - `Checkbox` — `({ checked: boolean; onChange: () => void; size?: "sm" | "md" })` animated monochrome checkbox.
  - `ProgressRing` — `({ percent: number; size?: number })` circular SVG tracker.
  - `Button` — `({ variant?: "solid" | "ghost"; ...buttonProps })`.
  - `Nav` — top nav linking `/`, `/template`, `/stats`.

- [ ] **Step 1: Define monochrome tokens & base styles**

In `tailwind.config.ts`, extend theme with a gray-driven palette and `backdropBlur`. In `app/globals.css`, set base background `#fafafa`, text near-black, a subtle noise/………keep minimal; define a `.glass` utility:
```css
.glass { background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(0,0,0,0.08); }
```
Set the app font to a clean sans (system UI stack or `next/font` Inter).

- [ ] **Step 2: Build `Card`**

`components/ui/Card.tsx` — a `div` with `.glass rounded-2xl p-6 shadow-sm` merged with `className`.

- [ ] **Step 3: Build `Checkbox`** (Framer Motion)

`components/ui/Checkbox.tsx`: a `motion.button` role="checkbox"; when `checked`, fill black, animate an SVG check path with `pathLength` 0→1; unchecked = 1px border. `size` maps to sm=18px, md=22px.

- [ ] **Step 4: Build `ProgressRing`**

`components/ui/ProgressRing.tsx`: SVG two-circle ring (track gray, progress black) using `strokeDasharray`/`strokeDashoffset` animated via Framer Motion `motion.circle`; centered `{percent}%` label. Pure-visual, no state.

- [ ] **Step 5: Build `Button` and `Nav`**

`Button`: solid = black bg/white text; ghost = transparent with border. `Nav`: minimal top bar with three `next/link`s; active link bold/underline via `usePathname`.

- [ ] **Step 6: Wire layout**

In `app/layout.tsx` render `<Nav />` above `{children}` inside a centered `max-w-2xl` container.

- [ ] **Step 7: Verify visually**

Run: `npm run dev`, open `http://localhost:3000`. Expected: nav renders, no console errors, monochrome styling applied.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: monochrome design tokens and base UI primitives"
```

---

### Task 6: Task mutation server actions

**Files:**
- Create: `app/actions/tasks.ts`

**Interfaces:**
- Consumes: `prisma`, `getOrCreateDailyLog`, `recomputeAndSaveProgress`, `taskIsComplete` (import the leaf logic).
- Produces (all are `"use server"` actions; all call `revalidatePath("/")` and return the new day progress where relevant):
  - `toggleTask(taskId: number, checked: boolean): Promise<void>` — sets task + **all its subtasks** to `checked`; recomputes progress.
  - `toggleSubTask(subTaskId: number, checked: boolean): Promise<void>` — sets subtask; then sets parent `isCompleted` = (all siblings complete); recomputes progress.
  - `addTask(dateKey: string, title: string, categoryId: number | null): Promise<void>`
  - `addSubTask(taskId: number, title: string): Promise<void>`
  - `updateTask(taskId: number, data: { title?: string; categoryId?: number | null }): Promise<void>`
  - `updateSubTask(subTaskId: number, title: string): Promise<void>`
  - `deleteTask(taskId: number): Promise<void>`
  - `deleteSubTask(subTaskId: number): Promise<void>`
  - `reorderTasks(orderedIds: number[]): Promise<void>` and `reorderSubTasks(orderedIds: number[]): Promise<void>`

- [ ] **Step 1: Implement toggle actions with parent/child rules**

Create `app/actions/tasks.ts` beginning with `"use server"`. Key logic:
```ts
export async function toggleTask(taskId: number, checked: boolean) {
  const task = await prisma.task.update({
    where: { id: taskId }, data: { isCompleted: checked }, select: { dailyLogId: true },
  });
  await prisma.subTask.updateMany({ where: { taskId }, data: { isCompleted: checked } });
  await recomputeAndSaveProgress(task.dailyLogId);
  revalidatePath("/");
}

export async function toggleSubTask(subTaskId: number, checked: boolean) {
  const sub = await prisma.subTask.update({
    where: { id: subTaskId }, data: { isCompleted: checked },
    select: { taskId: true, task: { select: { dailyLogId: true } } },
  });
  const siblings = await prisma.subTask.findMany({ where: { taskId: sub.taskId } });
  const allDone = siblings.length > 0 && siblings.every((s) => s.isCompleted);
  await prisma.task.update({ where: { id: sub.taskId }, data: { isCompleted: allDone } });
  await recomputeAndSaveProgress(sub.task.dailyLogId);
  revalidatePath("/");
}
```

- [ ] **Step 2: Implement add/update/delete/reorder**

Add the remaining actions. `addTask` resolves the `dailyLogId` via `getOrCreateDailyLog(new Date(dateKey))`, computes next `order` as `count`. Deletes rely on cascade for subtasks. Each mutating action ends with `recomputeAndSaveProgress(...)` (where a completion count could change) and `revalidatePath("/")`. `reorder*` maps `orderedIds` to `order` via a `prisma.$transaction` of updates.

- [ ] **Step 3: Manual verification via a temporary script**

Create `scripts/smoke.ts` that calls `getOrCreateDailyLog(new Date())`, toggles a task, and prints progress; run `npx tsx scripts/smoke.ts`. Expected: progress reflects the toggle. Delete the script after.

- [ ] **Step 4: Commit**

```bash
git add app/actions/tasks.ts && git commit -m "feat: task/subtask mutation server actions with parent-child sync"
```

---

### Task 7: Home dashboard — progress header, category summary, task list

**Files:**
- Modify: `app/page.tsx`
- Create: `components/dashboard/ProgressHeader.tsx`, `components/dashboard/CategorySummary.tsx`, `components/dashboard/TaskList.tsx`, `components/dashboard/TaskRow.tsx`, `components/dashboard/SubTaskRow.tsx`
- Create: `lib/confetti.ts`

**Interfaces:**
- Consumes: `getDay`, `getCategories`, `computeProgress`, `computeCategoryBreakdown`, task actions from Task 6, `ProgressRing`, `Card`, `Checkbox`.
- Produces: `fireConfetti(): void` (grayscale burst) in `lib/confetti.ts`; a working read+interact dashboard.

- [ ] **Step 1: Server-render today's data**

`app/page.tsx` (Server Component): `const day = await getDay(new Date()); const categories = await getCategories();` Map rows to `ProgressTask` shape; compute `progress` and `breakdown`. Render `ProgressHeader`, `CategorySummary`, then `TaskList` (client) with serializable props (include category name lookup).

- [ ] **Step 2: ProgressHeader**

`ProgressHeader.tsx`: `Card` containing `ProgressRing percent={progress}`, today's date, and "X of Y done". Include an "Edit Today's Plan" toggle button (lifts edit mode in `TaskList`).

- [ ] **Step 3: CategorySummary**

`CategorySummary.tsx`: `Card` listing `breakdown` rows (resolve `categoryId`→name; null→"Uncategorized"), each with a thin monochrome bar (`percent`) and `completed/total`, worst-first (already sorted). Heading: "Today by category".

- [ ] **Step 4: Grayscale confetti**

`lib/confetti.ts`:
```ts
import confetti from "canvas-confetti";
export function fireConfetti() {
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 },
    colors: ["#000000","#4b4b4b","#9a9a9a","#e5e5e5"] });
}
```

- [ ] **Step 5: TaskList / TaskRow / SubTaskRow (client)**

`TaskList.tsx` (`"use client"`): holds `editMode` state; renders `TaskRow`s inside Framer Motion `AnimatePresence` for expand/collapse. `TaskRow`: `Checkbox` bound to `toggleTask`; chevron to expand subtasks; when the row transitions to fully complete, call `fireConfetti()` and animate a strike-through (Framer Motion width 0→100% on a line over the title). `SubTaskRow`: `Checkbox` bound to `toggleSubTask` + strike-through. On any toggle, wrap the action in `useTransition` and let `revalidatePath` refresh server data; fire confetti client-side when `taskIsComplete` flips true, and when day progress hits 100.

- [ ] **Step 6: Verify end-to-end**

Run `npm run dev`; on `/` toggle a parent → all children check + confetti; toggle subtasks individually → parent auto-checks; ring + category bars update. Expected: all behaviors per spec.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: home dashboard with progress ring, category summary, animated task list"
```

---

### Task 8: Edit Today's Plan (day-scoped CRUD + reorder)

**Files:**
- Modify: `components/dashboard/TaskList.tsx`, `components/dashboard/TaskRow.tsx`, `components/dashboard/SubTaskRow.tsx`
- Create: `components/dashboard/AddTaskInline.tsx`, `components/dashboard/CategoryPicker.tsx`

**Interfaces:**
- Consumes: `addTask`, `addSubTask`, `updateTask`, `updateSubTask`, `deleteTask`, `deleteSubTask`, `reorderTasks`, `reorderSubTasks`; `categories` prop.
- Produces: an inline edit experience that never touches templates.

- [ ] **Step 1: Edit affordances**

When `editMode` is on: each `TaskRow`/`SubTaskRow` shows an inline-editable title (blur → `updateTask`/`updateSubTask`), a delete button, and drag handles. `TaskRow` shows a `CategoryPicker` (dropdown of `categories` + "Uncategorized") calling `updateTask({ categoryId })`.

- [ ] **Step 2: Add-on-the-fly**

`AddTaskInline`: text input + category dropdown → `addTask(dateKey, title, categoryId)`. Each expanded `TaskRow` gets an "+ add subtask" input → `addSubTask(taskId, title)`.

- [ ] **Step 3: Reordering**

Use Framer Motion `Reorder.Group`/`Reorder.Item` for parents and subtasks; on reorder end, call `reorderTasks(orderedIds)` / `reorderSubTasks(orderedIds)` inside `useTransition`.

- [ ] **Step 4: Verify template isolation**

Add/edit/delete tasks for today; then open `/template` (after Task 9) or inspect DB to confirm template rows are unchanged. Expected: today changes only.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit today's plan — day-scoped CRUD, category assignment, reorder"
```

---

### Task 9: Weekly Master Planner + category manager

**Files:**
- Create: `app/template/page.tsx`, `app/actions/template.ts`, `app/actions/categories.ts`
- Create: `components/template/DayColumn.tsx`, `components/template/CategoryManager.tsx`

**Interfaces:**
- Consumes: `prisma`, `getCategories`, `Card`, `Button`, `CategoryPicker`.
- Produces:
  - `app/actions/template.ts`: `addTemplateTask(dayOfWeek, title, categoryId)`, `updateTemplateTask(id, {title?, categoryId?})`, `deleteTemplateTask(id)`, `addTemplateSubTask(templateTaskId, title)`, `updateTemplateSubTask(id, title)`, `deleteTemplateSubTask(id)`, `reorderTemplateTasks(ids)`, `reorderTemplateSubTasks(ids)` — each `revalidatePath("/template")`.
  - `app/actions/categories.ts`: `addCategory(name)`, `renameCategory(id, name)`, `deleteCategory(id)`, `reorderCategories(ids)`.

- [ ] **Step 1: Template query + page**

`app/template/page.tsx` (Server Component): load all 7 `WeeklyTemplate`s with tasks→subtasks→category, and `getCategories()`. Render a `CategoryManager` and 7 `DayColumn`s (Mon→Sun).

- [ ] **Step 2: Template actions**

Implement `app/actions/template.ts` mirroring Task 6/8 CRUD but against `TemplateTask`/`TemplateSubTask` (no progress recompute — templates have no completion). `order` = current count on add.

- [ ] **Step 3: Category actions + manager**

Implement `app/actions/categories.ts`. `CategoryManager.tsx` (client): list categories with rename/delete/reorder + add input. `deleteCategory` relies on `onDelete: SetNull` so referencing tasks become Uncategorized.

- [ ] **Step 4: DayColumn UI**

`DayColumn.tsx` (client): a `Card` per weekday listing template tasks with `CategoryPicker`, expandable subtasks, add/edit/delete, and `Reorder` — same interaction vocabulary as the dashboard editor.

- [ ] **Step 5: Verify future-day propagation**

On `/template`, add a task to (a future weekday). Delete today's `DailyLog` row (or pick a not-yet-opened date) and open it → new task appears; already-materialized days are unaffected. Expected: template drives only future/unmaterialized days.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: weekly master planner and category manager"
```

---

### Task 10: Analytics & Stats dashboard (Recharts + category breakdown)

**Files:**
- Create: `app/stats/page.tsx`, `lib/stats.ts`, `lib/stats.test.ts`
- Create: `components/stats/StatsTabs.tsx`, `components/stats/DailyChart.tsx`, `components/stats/WeeklyChart.tsx`, `components/stats/MonthlyGrid.tsx`, `components/stats/YearlyChart.tsx`, `components/stats/CategoryBreakdownPanel.tsx`

**Interfaces:**
- Consumes: `prisma`, `computeCategoryBreakdown`, Recharts, `Card`.
- Produces (pure, tested in `lib/stats.ts`):
  - `type DayPoint = { date: string; total: number; completed: number; percent: number }`
  - `bucketDaily(logs, tasksByLog): DayPoint[]`
  - `bucketWeekly(points: DayPoint[]): { week: string; percent: number }[]`
  - `bucketMonthlyGrid(points: DayPoint[], year: number, month: number): (DayPoint | null)[]` (calendar-aligned)
  - `bucketYearly(points: DayPoint[]): { month: string; percent: number }[]`
  - `aggregateCategoryOverRange(tasks): CategoryBucket[]` (reuses `computeCategoryBreakdown` across many days)

- [ ] **Step 1: Write failing stats tests**

Create `lib/stats.test.ts` covering: `bucketWeekly` averages daily percents into ISO-week groups; `bucketYearly` groups by month; `bucketMonthlyGrid` pads leading blanks so day 1 lands on the correct weekday column. Include concrete inputs/outputs (real arrays, real expected values).

- [ ] **Step 2: Run to verify fail**

Run: `npm test lib/stats.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `lib/stats.ts`**

Implement all bucket functions as pure transforms over `DayPoint[]`. No Prisma imports here (keep it unit-testable).

- [ ] **Step 4: Run to verify pass**

Run: `npm test lib/stats.test.ts` → PASS.

- [ ] **Step 5: Stats data loading**

`app/stats/page.tsx` (Server Component): load all `DailyLog`s with tasks+subtasks+category; build `DayPoint[]` (using stored `progress` for percent, counts from rows) and the range-wide category tasks; pass to `StatsTabs`.

- [ ] **Step 6: Charts (monochrome Recharts)**

`StatsTabs` (client): tabs Daily / Weekly / Monthly / Yearly + always-visible `CategoryBreakdownPanel`. Charts use only black/gray fills & strokes, no legend colors. `MonthlyGrid`: GitHub-style grid, cell opacity scaled by `percent` (gray ramp). `CategoryBreakdownPanel`: ranked worst-first bars from `aggregateCategoryOverRange`, resolving category names.

- [ ] **Step 7: Verify**

Seed a few days by toggling tasks across dates (temporary script or manual date override), open `/stats`. Expected: all four tabs render, monthly grid aligns, category panel ranks weakest area first.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: analytics dashboard with tested aggregation and category breakdown"
```

---

## Self-Review Notes

- **Spec coverage:** Feature A → Task 9; Feature B (dashboard, progress header, dynamic calc) → Tasks 5–7; Feature C (day overrides, hierarchical parent/child, on-the-fly subtasks) → Tasks 6–8; Feature D (4 timelines + category breakdown) → Task 10; category concept → Tasks 2,4,6–10; Feature E → intentionally deferred (Global Constraints). Progress algorithm → Task 3 (tested). Template-vs-Instance invariant → Task 4 materialization + Tasks 8/9 verification steps.
- **Placeholder scan:** logic/pure tasks (3,4,10) contain full code + tests; UI tasks specify exact components, props, and interactions.
- **Type consistency:** `ProgressTask`/`CategoryBucket`/`DayPoint` defined once and reused; action signatures listed in Interfaces blocks match their call sites in later tasks.
