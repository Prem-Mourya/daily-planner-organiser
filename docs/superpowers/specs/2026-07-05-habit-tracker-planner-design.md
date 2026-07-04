# Minimalist Habit Tracker & Daily/Weekly Planner — Design

**Date:** 2026-07-05
**Status:** Approved (design), pending implementation plan

## Overview

A beautiful, personal, monochrome-minimalist habit tracker and daily/weekly
planner web app. Runs locally with a zero-config SQLite database. Built on a
"Template vs. Instance" architecture: a recurring weekly template configures
what populates each day, while each calendar day is an independent, editable
instance.

## Scope Decisions

- **Full build** of the planner + analytics in one effort.
- **Notifications (Feature E) deferred** — designed as a clean later add-on, not
  built now. Rationale: a localhost Next.js app can only fire browser
  notifications while a tab is open, so morning/midnight scheduling is
  unreliable without an always-on server or push service.
- **Charts via Recharts.**

## Tech Stack

- **Next.js (App Router)** — Server Components for data loading, Server Actions
  for mutations (no separate REST API layer for this local app).
- **Prisma + SQLite** — file DB at `prisma/dev.db`, zero-config.
- **Tailwind CSS** — monochrome design tokens (white/black/gray only).
- **Framer Motion** — expand/collapse, view transitions, strike-through anim.
- **canvas-confetti** — completion celebration, rendered grayscale to fit theme.
- **Recharts** — analytics charts.

## Design System & Visual Style

- **Palette:** strictly white, black, and gray family. One accent = pure black
  on white surfaces (inverted on dark surfaces).
- **Aesthetics:** clean typography, generous whitespace, subtle 1px borders,
  high-contrast checked states, glass cards (`backdrop-filter: blur`), sleek
  modern cards.
- **Animations:** smooth Framer Motion transitions for expand/collapse and view
  switches; a premium completion animation combining a custom strike-through
  transition with a canvas-confetti burst.

## Data Model (Prisma + SQLite)

Template side and Instance side are **fully separate tables** with real
relations (not JSON blobs) for clean querying, sorting, and analytics.

```
WeeklyTemplate   { id, dayOfWeek (unique: Monday..Sunday), createdAt }
TemplateTask     { id, templateId -> WeeklyTemplate, title, order }
TemplateSubTask  { id, templateTaskId -> TemplateTask, title, order }

DailyLog         { id, date (unique, date-only), progress (Float) }
Task             { id, dailyLogId -> DailyLog, title, isCompleted (Bool), order }
SubTask          { id, taskId -> Task, title, isCompleted (Bool), order }
```

**Lazy instantiation:** A `DailyLog` for a date is materialized the first time
that day is opened. We read that weekday's `WeeklyTemplate` and copy its
`TemplateTask`/`TemplateSubTask` rows into `Task`/`SubTask` rows for that date.
After materialization the day is fully independent — editing a day never touches
the template, and editing the template never retroactively alters existing days.

Cascade deletes: deleting a `Task` deletes its `SubTask`s; deleting a
`TemplateTask` deletes its `TemplateSubTask`s; deleting a `DailyLog` deletes its
`Task`s.

## Progress Algorithm

Header progress percentage:

- A **leaf** = a subtask, OR a parent task with no children. Each leaf is worth
  1 unit, counted as complete when its `isCompleted` is true.
- A **parent with children** is worth the fraction of its children completed. It
  is not itself an extra unit — its children represent it.
- **Overall % = (completed leaf count) / (total leaf count) × 100**, rounded for
  display. If there are zero leaves, progress = 0%.

Example: "Studies" (2 subtasks, 1 done) + "Vitamins" (no children, done) →
leaves = 3, completed = 2 → 67%.

Progress is recomputed and persisted to `DailyLog.progress` on every mutation so
analytics can read historical values directly.

## Parent/Child Checkbox Behavior

- Check a parent → checks all of its children.
- Check every child individually → parent auto-checks.
- Uncheck any child → parent unchecks.
- A parent with no children is a simple binary checkbox.

## Completion Celebration

- Confetti (grayscale) fires when a **top-level task** becomes fully complete
  (all its leaves done) and when the day reaches **100%**.
- Completed items get an animated custom strike-through transition.

## Screens & Routes

### `/` — Home Dashboard (Feature B & C)
- **Progress Header Card** at top: sleek circular tracker showing today's
  completion %, using the proportional algorithm above.
- **Today's task list**: dynamically loads the current day's instance (lazily
  instantiated from the weekday template on first open).
- Hierarchical tasks: parents expand/collapse to reveal children; native
  checkboxes on both levels; append new child tasks on the fly.
- **"Edit Today's Plan"**: inline edit mode to add / edit / delete / reorder
  tasks and subtasks for that specific calendar day only, without altering the
  weekly template.

### `/template` — Weekly Master Planner (Feature A)
- 7-day (Monday–Sunday) configurator for the baseline recurring routine.
- Add, sort/reorder, and nest sub-tasks within baseline items.
- Editing the template changes what populates future days only.

### `/stats` — Analytics & Stats Dashboard (Feature D)
Tabbed views, all via Recharts, in the monochrome style:
- **Daily:** day-by-day task volume vs completion rate.
- **Weekly:** week-over-week comparative bar/line chart.
- **Monthly:** GitHub-style contribution grid showing consistency across the
  month.
- **Yearly:** broad high-level progress tracking.

## Deferred: Notifications (Feature E)

Not built in this phase. Future design: client-side Web Notification API with an
interval system (morning briefing, intermittent pending-task reminders, midnight
check), each drawing from a curated array of motivational quotes. Documented as
a clean later add-on.

## Out of Scope (YAGNI)

- Multi-user / auth (personal single-user local app).
- Cloud sync / deployment (local SQLite file).
- Real background/push notifications requiring an always-on server.
