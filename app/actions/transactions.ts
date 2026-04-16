"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { z } from "zod";
import { getUserId } from "@/lib/auth-utils";
import { TransactionType } from "@prisma/client";

const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().min(1),
  accountId: z.string().optional().nullable(),
  description: z.string().max(100).optional().nullable(),
  date: z.coerce.date(),
  vehicleId: z.string().optional().nullable(),
  odo: z.coerce.number().optional().nullable(),
  socIni: z.coerce.number().optional().nullable(),
  socFin: z.coerce.number().optional().nullable(),
  kwhGrid: z.coerce.number().optional().nullable(),
  evOrigin: z.string().optional().nullable(),
});

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTransactionInput = {
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId?: string | null;
  description?: string | null;
  date: Date;
  vehicleId?: string | null;
  odo?: number | null;
  socIni?: number | null;
  socFin?: number | null;
  kwhGrid?: number | null;
  evOrigin?: string | null;
};

export async function getOrCreateCategory(
  name: string,
  type: TransactionType,
): Promise<Category | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const existingCategory = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      type,
    },
  });

  if (existingCategory) {
    return existingCategory as Category;
  }

  const newCategory = await prisma.category.create({
    data: {
      userId,
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      type,
      icon: "Circle",
      color: "#94a3b8",
    },
  });

  return newCategory as Category;
}

export async function createTransaction(data: CreateTransactionInput) {
  const userId = await getUserId();
  if (!userId) throw new Error("Could not resolve user ID");

  const validatedFields = transactionSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    amount,
    type,
    categoryId,
    accountId,
    description,
    date,
    vehicleId,
    odo,
    socIni,
    socFin,
    kwhGrid,
    evOrigin,
  } = validatedFields.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 0. Get category info for special handling
      const category = await tx.category.findUnique({
        where: { id: categoryId },
      });

      // 1. Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          type,
          categoryId,
          accountId: accountId || null,
          description: description || null,
          date,
          vehicleId: vehicleId || null,
          odo: odo || null,
          socIni: socIni || null,
          socFin: socFin || null,
          kwhGrid: kwhGrid || null,
          evOrigin: evOrigin || null,
        },
      });

      // 2. Update the main account balance
      if (accountId) {
        const account = await tx.bankAccount.findUnique({
          where: { id: accountId },
        });
        if (account) {
          const isCreditOrEnergy =
            account.type === "CREDIT" || account.type === "ENERGY";
          let balanceChange = amount;

          if (type === TransactionType.EXPENSE) {
            balanceChange = isCreditOrEnergy ? amount : -amount;
          } else {
            balanceChange = isCreditOrEnergy ? -amount : amount;
          }

          await tx.bankAccount.update({
            where: { id: accountId },
            data: { balance: { increment: balanceChange } },
          });
        }
      }

      // 3. Handle Debt Crossing (Pago Préstamo)
      if (category?.name === "Pago Préstamo" && description) {
        const debtAccount = await tx.bankAccount.findFirst({
          where: {
            userId,
            name: { equals: description.trim(), mode: "insensitive" },
            type: "CREDIT",
          },
        });

        if (debtAccount && debtAccount.id !== accountId) {
          await tx.bankAccount.update({
            where: { id: debtAccount.id },
            data: { balance: { decrement: amount } },
          });
        }
      }

      return transaction;
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions");
    revalidatePath("/finance/accounts");
    revalidatePath("/finance/ev-stats");
    revalidateTag(`transactions-${userId}`, "max");
    revalidateTag(`accounts-${userId}`, "max");

    return {
      success: true,
      transaction: { 
        id: result.id,
        amount: Number(result.amount),
        description: result.description,
        date: result.date.toISOString(),
        type: result.type,
        categoryId: result.categoryId,
        accountId: result.accountId,
        vehicleId: result.vehicleId,
        kwhGrid: result.kwhGrid ? Number(result.kwhGrid) : null,
      },
    };
  } catch (err) {
    console.error("Failed to create transaction:", err);
    return { error: "Database error" };
  }
}

const getCachedCategories = (userId: string) => 
  unstable_cache(
    async () => {
      return await prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    },
    ["categories-list", userId],
    {
      tags: [`categories-${userId}`],
      revalidate: 60,
    }
  )();

export async function getCategories(providedUserId?: string): Promise<Category[]> {
  const userId = providedUserId || (await getUserId());
  if (!userId) return [];
  return (await getCachedCategories(userId)) as Category[];
}

const getCachedBankAccounts = (userId: string) => 
  unstable_cache(
    async () => {
      return await prisma.bankAccount.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    },
    ["bank-accounts-list", userId],
    {
      tags: [`accounts-${userId}`],
      revalidate: 60,
    }
  )();

export async function getBankAccounts(providedUserId?: string) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return [];

  const accounts = await getCachedBankAccounts(userId);

  return accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    balance: Number(acc.balance),
    currency: acc.currency,
    color: acc.color,
    userId: acc.userId,
    createdAt: new Date(acc.createdAt).toISOString(),
    updatedAt: new Date(acc.updatedAt).toISOString(),
  }));
}

export async function getTransaction(id: string) {
  const userId = await getUserId();
  if (!userId) return null;

  const transaction = await prisma.transaction.findUnique({
    where: { id, userId },
    include: { category: true },
  });

  if (!transaction) return null;

  return {
    id: transaction.id,
    amount: Number(transaction.amount),
    description: transaction.description,
    date: transaction.date.toISOString(),
    type: transaction.type,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    vehicleId: transaction.vehicleId,
    userId: transaction.userId,
    odo: transaction.odo,
    socIni: transaction.socIni,
    socFin: transaction.socFin,
    kwhGrid: transaction.kwhGrid ? Number(transaction.kwhGrid) : null,
    evOrigin: transaction.evOrigin,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    category: transaction.category ? {
      id: transaction.category.id,
      name: transaction.category.name,
      icon: transaction.category.icon,
      color: transaction.category.color,
      type: transaction.category.type,
    } : null,
  };
}


export async function updateTransaction(
  id: string,
  data: CreateTransactionInput,
) {
  const userId = await getUserId();
  if (!userId) return { error: "Unauthorized" };

  const validatedFields = transactionSchema.safeParse(data);
  if (!validatedFields.success) return { error: "Invalid fields" };

    const { 
      amount, type, categoryId, accountId, description, date,
      vehicleId, odo, socIni, socFin, kwhGrid, evOrigin
    } = validatedFields.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get old transaction state with category
      const oldTx = await tx.transaction.findUnique({
        where: { id, userId },
        include: { category: true },
      });
      if (!oldTx) throw new Error("Transaction not found");

      // 2. Revert OLD balance impact
      if (oldTx.accountId) {
        const oldAcc = await tx.bankAccount.findUnique({
          where: { id: oldTx.accountId },
        });
        if (oldAcc) {
          const isCreditOrEnergy = oldAcc.type === "CREDIT" || oldAcc.type === "ENERGY";
          const oldAmt = Number(oldTx.amount);
          let balanceReversal = 0;
          if (oldTx.type === TransactionType.EXPENSE) {
            balanceReversal = isCreditOrEnergy ? -oldAmt : oldAmt;
          } else {
            balanceReversal = isCreditOrEnergy ? oldAmt : -oldAmt;
          }
          await tx.bankAccount.update({
            where: { id: oldTx.accountId },
            data: { balance: { increment: balanceReversal } },
          });
        }
      }

      // 3. Revert OLD Debt Crossing
      if (oldTx.category?.name === "Pago Préstamo" && oldTx.description) {
        const oldDebtAcc = await tx.bankAccount.findFirst({
          where: {
            userId,
            name: { equals: oldTx.description.trim(), mode: "insensitive" },
            type: "CREDIT",
          },
        });
        if (oldDebtAcc && oldDebtAcc.id !== oldTx.accountId) {
          await tx.bankAccount.update({
            where: { id: oldDebtAcc.id },
            data: { balance: { increment: Number(oldTx.amount) } },
          });
        }
      }

      // 4. Update the transaction itself
      const updated = await tx.transaction.update({
        where: { id, userId },
        data: {
          amount,
          type,
          categoryId,
          accountId: accountId || null,
          description: description || null,
          date,
          vehicleId: vehicleId || null,
          odo: odo || null,
          socIni: socIni || null,
          socFin: socFin || null,
          kwhGrid: kwhGrid || null,
          evOrigin: evOrigin || null,
        },
        include: { category: true },
      });

      // 5. Apply NEW balance impact
      if (accountId) {
        const newAcc = await tx.bankAccount.findUnique({
          where: { id: accountId },
        });
        if (newAcc) {
          const isCreditOrEnergy = newAcc.type === "CREDIT" || newAcc.type === "ENERGY";
          let balanceChange = 0;
          if (type === TransactionType.EXPENSE) {
            balanceChange = isCreditOrEnergy ? amount : -amount;
          } else {
            balanceChange = isCreditOrEnergy ? -amount : amount;
          }
          await tx.bankAccount.update({
            where: { id: accountId },
            data: { balance: { increment: balanceChange } },
          });
        }
      }

      // 6. Apply NEW Debt Crossing
      if (updated.category?.name === "Pago Préstamo" && description) {
        const newDebtAcc = await tx.bankAccount.findFirst({
          where: {
            userId,
            name: { equals: description.trim(), mode: "insensitive" },
            type: "CREDIT",
          },
        });
        if (newDebtAcc && newDebtAcc.id !== accountId) {
          await tx.bankAccount.update({
            where: { id: newDebtAcc.id },
            data: { balance: { decrement: amount } },
          });
        }
      }

      return updated;
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions");
    revalidatePath("/finance/accounts");
    revalidatePath("/finance/ev-stats");
    revalidateTag(`transactions-${userId}`, "max");
    revalidateTag(`accounts-${userId}`, "max");

    return {
      success: true,
      transaction: { 
        id: result.id,
        amount: Number(result.amount),
        description: result.description,
        date: result.date.toISOString(),
        type: result.type,
        categoryId: result.categoryId,
        accountId: result.accountId,
        vehicleId: result.vehicleId,
        kwhGrid: result.kwhGrid ? Number(result.kwhGrid) : null,
      },
    };
  } catch (err) {
    console.error("Update error:", err);
    return { error: "Failed to update transaction" };
  }
}

export async function getRecentCategoryIds() {
  const userId = await getUserId();
  if (!userId) return [];

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100, // Increase to ensure we get some for each type
    select: { categoryId: true },
  });

  const categoryIds = recentTransactions
    .map((t) => t.categoryId)
    .filter((id): id is string => id !== null);

  return Array.from(new Set(categoryIds)).slice(0, 15);
}

export async function getRecentAccountIds() {
  const userId = await getUserId();
  if (!userId) return [];

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 50,
    select: { accountId: true },
  });

  const accountIds = recentTransactions
    .map((t) => t.accountId)
    .filter((id): id is string => id !== null);

  return Array.from(new Set(accountIds)).slice(0, 5);
}

const getCachedEVStats = (userId: string, startStr: string, endStr: string, vehicleId?: string) => 
  unstable_cache(
    async () => {
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          description: { startsWith: "EV:" },
          ...(vehicleId && vehicleId !== "ALL" ? { vehicleId } : {}),
        },
        select: { amount: true, description: true, date: true, id: true },
        orderBy: { date: "desc" },
      });

      const total = transactions.reduce(
        (acc, curr) => acc + Number(curr.amount),
        0,
      );

      return {
        total,
        count: transactions.length,
        transactions: transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          date: t.date.toISOString(),
        })),
      };
    },
    ["ev-stats-range", userId, startStr, endStr, vehicleId || "ALL"],
    {
      tags: [`transactions-${userId}`],
      revalidate: 3600,
    }
  )();

export async function getEVStatsInRange(
  startDate: Date, 
  endDate: Date, 
  vehicleId?: string,
  providedUserId?: string
) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return { total: 0, count: 0, transactions: [] };

  return getCachedEVStats(
    userId,
    startDate.toISOString(),
    endDate.toISOString(),
    vehicleId
  );
}

export async function getPreviousMonthEVStats(providedUserId?: string) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return { total: 0, count: 0, transactions: [] };

  const now = new Date();
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  return getEVStatsInRange(firstOfLastMonth, endOfLastMonth, undefined, userId);
}

import { getVehicles } from "./vehicles";

export async function getTransactionFormData(id?: string, providedUserId?: string) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return { categories: [], recentIds: [], recentAccountIds: [], accounts: [], evStats: { total: 0, count: 0, transactions: [] }, vehicles: [] };

  const [categories, accounts, vehicles, transaction, evStats, lastOdoTx] = await Promise.all([
    getCategories(userId),
    getBankAccounts(userId),
    getVehicles(userId),
    id ? getTransaction(id) : Promise.resolve(null),
    getPreviousMonthEVStats(userId),
    prisma.transaction.findFirst({
      where: { userId, NOT: { odo: null } },
      orderBy: { odo: "desc" },
      select: { odo: true }
    })
  ]);

  const recentTx = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
    select: { categoryId: true, accountId: true }
  });

  const recentIds = Array.from(new Set(recentTx.map(t => t.categoryId).filter(Boolean))).slice(0, 5) as string[];
  const recentAccountIds = Array.from(new Set(recentTx.map(t => t.accountId).filter(Boolean))).slice(0, 5) as string[];

  return {
    categories,
    recentIds,
    recentAccountIds,
    accounts,
    transaction,
    evStats,
    vehicles,
    lastOdo: lastOdoTx?.odo || 0,
  };
}

