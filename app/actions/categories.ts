"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getUserId } from "@/lib/auth-utils";

export async function createCategory(data: {
  name: string;
  icon: string;
  color: string;
}) {
  const userId = await getUserId();
  if (!userId) return { error: "User not found" };

  try {
    const count = await prisma.category.count({ where: { userId } });
    if (count >= 10) return { error: "Límite alcanzado: máximo 10 categorías" };

    const category = await prisma.category.create({
      data: {
        ...data,
        type: "EXPENSE",
        userId: userId,
      },
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions/new");
    revalidatePath("/finance/categories");
    revalidateTag(`categories-${userId}`, "max");
    return { success: true, category };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    icon: string;
    color: string;
  },
) {
  const userId = await getUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const category = await prisma.category.update({
      where: { id, userId },
      data,
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions/new");
    revalidatePath("/finance/categories");
    revalidateTag(`categories-${userId}`, "max");
    return { success: true, category };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    await prisma.category.delete({
      where: { id, userId },
    });

    revalidatePath("/finance");
    revalidatePath("/finance/transactions/new");
    revalidatePath("/finance/categories");
    revalidateTag(`categories-${userId}`, "max");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete category (it may have transactions)" };
  }
}
