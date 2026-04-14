"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { getUserId } from "@/lib/auth-utils";
import { unstable_cache } from "next/cache";

const getCachedDashboardData = unstable_cache(
  async (userId: string, fromStr: string, toStr: string) => {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const dateFilter = { gte: from, lte: to };

    // Optimized: 3 queries handled in parallel
    const [
      allStats,
      recentTransactions,
      categories,
    ] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type", "categoryId"],
        where: { userId, date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId, type: "EXPENSE", date: dateFilter },
        orderBy: { date: "desc" },
        take: 10,
        include: { category: true },
      }),
      prisma.category.findMany({ where: { userId } }),
    ]);

    const totalIncome = allStats
      .filter((s) => s.type === "INCOME")
      .reduce((acc, s) => acc + (s._sum.amount?.toNumber() ?? 0), 0);

    const totalExpense = allStats
      .filter((s) => s.type === "EXPENSE")
      .reduce((acc, s) => acc + (s._sum.amount?.toNumber() ?? 0), 0);

    const balance = totalIncome - totalExpense;

    const formattedTransactions = recentTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      date: t.date.toISOString(),
      type: t.type,
      categoryId: t.categoryId,
      category: t.category,
    }));

    const categoryStats = allStats
      .filter((s) => s.type === "EXPENSE")
      .map((stat) => {
        const cat = categories.find((c) => c.id === stat.categoryId);
        return {
          name: cat?.name || "Sin categoría",
          value: stat._sum.amount?.toNumber() ?? 0,
          color: cat?.color || "#888888",
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      balance,
      totalIncome,
      totalExpense,
      recentTransactions: formattedTransactions,
      categoryStats,
    };
  },
  ["dashboard-data"],
  {
    tags: ["transactions", "categories"],
    revalidate: 3600,
  }
);

export async function getDashboardData(
  startDate?: Date,
  endDate?: Date,
  providedUserId?: string
) {
  const userId = providedUserId || (await getUserId());
  
  if (!userId) {
    return {
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      recentTransactions: [],
      categoryStats: [],
    };
  }

  const from = startDate || startOfMonth(new Date());
  const to = endDate || endOfMonth(new Date());

  return getCachedDashboardData(
    userId,
    from.toISOString(),
    to.toISOString()
  );
}







