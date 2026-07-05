import { Card } from "@/components/ui/Card";
import type { TaskRank } from "@/lib/stats";

// Same traffic-light thresholds as the calendar, applied to a task's completion
// rate so the worst offenders read red at a glance.
function rateColor(percent: number): string {
  if (percent >= 100) return "#16a34a";
  if (percent >= 50) return "#eab308";
  return "#dc2626";
}

export function TaskRanking({ ranks }: { ranks: TaskRank[] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-black">Tasks ranked (neglected first)</h2>
      <p className="mt-1 text-xs text-black/40">
        How often you finish each recurring task — lowest first.
      </p>
      {ranks.length === 0 ? (
        <p className="mt-4 text-sm text-black/40">No task history yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {ranks.map((task) => (
            <li key={task.title}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-black/80">{task.title}</span>
                <span className="shrink-0 tabular-nums text-black/40">
                  {task.done}/{task.total} days &middot;{" "}
                  <span style={{ color: rateColor(task.percent) }}>{task.percent}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-black/70 transition-[width] duration-500 ease-out"
                  style={{ width: `${task.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
