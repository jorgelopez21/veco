"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.string(),
  balance: z.union([z.number(), z.string().transform((v) => Number(v) || 0)]),
  currency: z.string().default("COP"),
  color: z.string().optional(),
});

export async function createBankAccount(data: { name: string; balance?: number; currency?: string; color?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const validated = accountSchema.safeParse(data);
  if (!validated.success) {
    console.error("[createBankAccount] Validation failed", validated.error.format());
    return { error: "Datos de cuenta inválidos" };
  }

  const { name, type, balance, currency, color } = validated.data;

  try {
    const account = await prisma.bankAccount.create({
      data: {
        name,
        type,
        balance: balance || 0,
        currency: currency || "COP",
        color: color || "#3b82f6",
        userId: session.user.id,
      },
    });

    console.log(`[createBankAccount] Success: ${account.id}`);
    revalidateTag(`accounts-${session.user.id}`);
    revalidatePath("/finance/accounts");
    revalidatePath("/finance/transactions/new");
    return {
      success: true,
      account: {
        ...account,
        balance: Number(account.balance),
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("[createBankAccount] Error:", err);
    return { error: "Error al crear la cuenta en la base de datos" };
  }
}

export async function updateBankAccount(id: string, data: Partial<{ name: string; balance: number; currency: string; color: string }>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const validated = accountSchema.partial().safeParse(data);
  if (!validated.success) {
    return { error: "Datos de actualización inválidos" };
  }

  try {
    const account = await prisma.bankAccount.update({
      where: { id, userId: session.user.id },
      data: validated.data,
    });

    revalidateTag(`accounts-${session.user.id}`);
    revalidatePath("/finance/accounts");
    return {
      success: true,
      account: {
        ...account,
        balance: Number(account.balance),
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("[updateBankAccount] Error:", err);
    return { error: "Error al actualizar la cuenta" };
  }
}

export async function deleteBankAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  try {
    await prisma.bankAccount.delete({
      where: { id, userId: session.user.id },
    });

    revalidateTag(`accounts-${session.user.id}`);
    revalidatePath("/finance/accounts");
    return { success: true };
  } catch {
    return {
      error:
        "No se puede eliminar la cuenta (posiblemente tiene transacciones)",
    };
  }
}
