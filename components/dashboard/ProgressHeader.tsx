import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatLongDate } from "@/lib/date";

export function ProgressHeader({
  date,
  progress,
  completedLeaves,
  totalLeaves,
  emptyLabel = "No tasks planned for today",
}: {
  date: Date;
  progress: number;
  completedLeaves: number;
  totalLeaves: number;
  emptyLabel?: string;
}) {
  return (
    <Card className="flex items-center gap-5">
      <ProgressRing percent={progress} size={72} />
      <div>
        <h1 className="text-lg font-semibold text-black">{formatLongDate(date)}</h1>
        <p className="mt-1 text-sm text-black/50">
          {totalLeaves === 0 ? emptyLabel : `${completedLeaves} of ${totalLeaves} done`}
        </p>
      </div>
    </Card>
  );
}
