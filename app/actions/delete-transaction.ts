"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getUserId } from "@/lib/auth-utils";

export async function deleteTransaction(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch transaction with category info
      const transaction = await tx.transaction.findUnique({
        where: { id, userId },
        include: { category: true },
      });

      if (!transaction) throw new Error("Transaction not found");

      // 2. Revert main account balance
      if (transaction.accountId) {
        const account = await tx.bankAccount.findUnique({
          where: { id: transaction.accountId },
        });
        if (account) {
          const isCreditOrEnergy = account.type === "CREDIT" || account.type === "ENERGY";
          const amount = Number(transaction.amount);
          let balanceReversal = amount;

          if (transaction.type === "EXPENSE") {
            // To revert an expense: decrease debt in credit/energy, increase balance in liquid
            balanceReversal = isCreditOrEnergy ? -amount : amount;
          } else {
            // To revert an income: increase debt in credit/energy, decrease balance in liquid
            balanceReversal = isCreditOrEnergy ? amount : -amount;
          }

          await tx.bankAccount.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: balanceReversal } },
          });
        }
      }

      // 3. Revert Debt Crossing (Pago Préstamo)
      if (
        transaction.category?.name === "Pago Préstamo" &&
        transaction.description
      ) {
        const debtAccount = await tx.bankAccount.findFirst({
          where: {
            userId,
            name: {
              equals: transaction.description.trim(),
              mode: "insensitive",
            },
            type: "CREDIT",
          },
        });

        // Only revert if it's a DIFFERENT account than the main one to avoid double-counting
        if (debtAccount && debtAccount.id !== transaction.accountId) {
          // To revert a payment (which decreased debt), we must increment debt
          await tx.bankAccount.update({
            where: { id: debtAccount.id },
            data: { balance: { increment: Number(transaction.amount) } },
          });
        }
      }

      // 4. Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions");
    revalidatePath("/finance/accounts");
    revalidatePath("/finance/ev-stats");
    revalidateTag(`transactions-${userId}`, "max");
    revalidateTag(`accounts-${userId}`, "max");
    
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete transaction" };
  }
}
