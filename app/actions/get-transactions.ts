"use server";

import { getUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

const getCachedTransactions = unstable_cache(
  async (userId: string, optionsStr: string) => {
    const options = JSON.parse(optionsStr);
    const whereClause: Prisma.TransactionWhereInput = {
      userId,
    };

    if (options.startDate || options.endDate) {
      whereClause.date = {};
      if (options.startDate) whereClause.date.gte = new Date(options.startDate);
      if (options.endDate) whereClause.date.lte = new Date(options.endDate);
    }

    if (options.categoryId) whereClause.categoryId = options.categoryId;
    if (options.accountId) whereClause.accountId = options.accountId;
    if (options.type) whereClause.type = options.type;
    if (options.vehicleId && options.vehicleId !== "ALL") whereClause.vehicleId = options.vehicleId;

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: options.limit || 50,
      include: {
        category: true,
        account: true,
        vehicle: true,
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      date: t.date.toISOString(),
      type: t.type,
      categoryId: t.categoryId,
      vehicleId: t.vehicleId,
      userId: t.userId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      category: t.category,
      vehicle: t.vehicle ? {
        id: t.vehicle.id,
        brand: t.vehicle.brand,
        model: t.vehicle.model,
      } : null,
      account: t.account ? {
        id: t.account.id,
        name: t.account.name,
        type: t.account.type,
        color: t.account.color,
      } : null,
    }));
  },
  ["transactions-list"],
  {
    tags: ["transactions"],
    revalidate: 3600,
  }
);

export async function getTransactions(
  options: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    accountId?: string;
    type?: "INCOME" | "EXPENSE";
    vehicleId?: string;
    limit?: number;
  } = {},
  providedUserId?: string
) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return [];

  const optionsStr = JSON.stringify({
    ...options,
    startDate: options.startDate?.toISOString(),
    endDate: options.endDate?.toISOString(),
  });

  return getCachedTransactions(userId, optionsStr);
}

