import { Card } from "@/components/ui/Card";

function plural(n: number): string {
  return n === 1 ? "day" : "days";
}

export function StreakHeader({ current, longest }: { current: number; longest: number }) {
  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-black/40">
            Current streak
          </span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-black">{current}</span>
            <span className="text-sm text-black/50">{plural(current)}</span>
          </span>
          <span className="mt-1 text-xs text-black/40">days in a row at 50%+</span>
        </div>
        <div className="flex flex-col border-l border-black/10 pl-4">
          <span className="text-xs font-medium uppercase tracking-wide text-black/40">
            Longest streak
          </span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-black">{longest}</span>
            <span className="text-sm text-black/50">{plural(longest)}</span>
          </span>
          <span className="mt-1 text-xs text-black/40">your personal best</span>
        </div>
      </div>
    </Card>
  );
}
