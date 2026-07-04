import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";

function formatToday(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ProgressHeader({
  date,
  progress,
  completedLeaves,
  totalLeaves,
}: {
  date: Date;
  progress: number;
  completedLeaves: number;
  totalLeaves: number;
}) {
  return (
    <Card className="flex items-center gap-5">
      <ProgressRing percent={progress} size={72} />
      <div>
        <h1 className="text-lg font-semibold text-black">{formatToday(date)}</h1>
        <p className="mt-1 text-sm text-black/50">
          {totalLeaves === 0
            ? "No tasks planned for today"
            : `${completedLeaves} of ${totalLeaves} done`}
        </p>
      </div>
    </Card>
  );
}
