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
