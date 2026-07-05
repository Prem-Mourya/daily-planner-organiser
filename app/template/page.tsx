import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/queries";
import { CategoryManager } from "@/components/template/CategoryManager";
import type { TemplateTaskViewModel } from "@/components/template/DayColumn";
import { DayBoard, type DayData } from "@/components/template/DayBoard";

// Reads live template/category state — render per request, not at build time.
export const dynamic = "force-dynamic";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export default async function TemplatePage() {
  const [templates, categories] = await Promise.all([
    prisma.weeklyTemplate.findMany({
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: {
            subTasks: { orderBy: { order: "asc" } },
            category: true,
          },
        },
      },
    }),
    getCategories(),
  ]);

  const byDay = new Map(templates.map((t) => [t.dayOfWeek, t]));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const days: DayData[] = DAY_ORDER.map((dayOfWeek) => {
    const template = byDay.get(dayOfWeek);
    const tasks: TemplateTaskViewModel[] =
      template?.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        categoryId: task.categoryId,
        categoryName: task.category?.name ?? null,
        subTasks: task.subTasks.map((sub) => ({ id: sub.id, title: sub.title })),
      })) ?? [];
    return { dayOfWeek, tasks };
  });

  return (
    <main className="flex flex-col gap-6 py-8">
      <CategoryManager categories={categoryOptions} />
      <DayBoard days={days} categories={categoryOptions} />
    </main>
  );
}
