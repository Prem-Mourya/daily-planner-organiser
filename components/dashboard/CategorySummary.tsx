import { Card } from "@/components/ui/Card";
import type { CategoryBucket } from "@/lib/progress";

export type CategoryLookup = { id: number; name: string }[];

function resolveName(categoryId: number | null, categories: CategoryLookup): string {
  if (categoryId === null) return "Uncategorized";
  return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
}

export function CategorySummary({
  breakdown,
  categories,
}: {
  breakdown: CategoryBucket[];
  categories: CategoryLookup;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-black">Today by category</h2>
      {breakdown.length === 0 ? (
        <p className="mt-3 text-sm text-black/40">Nothing to track yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {breakdown.map((bucket) => {
            const name = resolveName(bucket.categoryId, categories);
            return (
              <li key={bucket.categoryId ?? "uncategorized"}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/80">{name}</span>
                  <span className="text-black/40">
                    {bucket.completed}/{bucket.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-black/70 transition-[width] duration-500 ease-out"
                    style={{ width: `${bucket.percent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
