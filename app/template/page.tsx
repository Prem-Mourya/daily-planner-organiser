import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/queries";
import { CategoryManager } from "@/components/template/CategoryManager";
import { DayColumn, type TemplateTaskViewModel } from "@/components/template/DayColumn";

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

  return (
    <main className="flex flex-col gap-6 py-8">
      <CategoryManager categories={categoryOptions} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {DAY_ORDER.map((dayOfWeek) => {
          const template = byDay.get(dayOfWeek);
          const taskViewModels: TemplateTaskViewModel[] =
            template?.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              categoryId: task.categoryId,
              categoryName: task.category?.name ?? null,
              subTasks: task.subTasks.map((sub) => ({
                id: sub.id,
                title: sub.title,
              })),
            })) ?? [];

          return (
            <DayColumn
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              tasks={taskViewModels}
              categories={categoryOptions}
            />
          );
        })}
      </div>
    </main>
  );
}
