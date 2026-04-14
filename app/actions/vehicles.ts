"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getUserId } from "@/lib/auth-utils";


const getCachedVehicles = (userId: string) => 
  unstable_cache(
    async () => {
      return await prisma.vehicle.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    },
    ["vehicles-list", userId],
    {
      tags: [`vehicles-${userId}`],
      revalidate: 3600,
    }
  )();

export async function getVehicles(providedUserId?: string) {
  const userId = providedUserId || (await getUserId());
  if (!userId) return [];

  const vehicles = await getCachedVehicles(userId);
  
  return vehicles.map(v => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    batteryCapacity: Number(v.batteryCapacity),
    degradation: Number(v.degradation),
    userId: v.userId,
    createdAt: new Date(v.createdAt).toISOString(),
    updatedAt: new Date(v.updatedAt).toISOString(),
  }));
}

export async function createVehicle(data: {
  brand: string;
  model: string;
  batteryCapacity: number;
  degradation: number;
}) {
  const userId = await getUserId();
  if (!userId) return { error: "No autorizado" };

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        brand: data.brand,
        model: data.model,
        batteryCapacity: data.batteryCapacity,
        degradation: data.degradation,
        userId: userId as string,
      },
    });

    revalidateTag(`vehicles-${userId}`, "max");
    revalidatePath("/finance/vehicles");
    revalidatePath("/finance/transactions/new");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return { error: "Error al crear el vehículo" };
  }
}

export async function updateVehicle(id: string, data: {
  brand?: string;
  model?: string;
  batteryCapacity?: number;
  degradation?: number;
}) {
  const userId = await getUserId();
  if (!userId) return { error: "No autorizado" };

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id, userId },
      data: {
        brand: data.brand,
        model: data.model,
        batteryCapacity: data.batteryCapacity,
        degradation: data.degradation,
      },
    });

    revalidateTag(`vehicles-${userId}`, "max");
    revalidatePath("/finance/vehicles");
    return { success: true, vehicle };
  } catch {
    return { error: "Error al actualizar el vehículo" };
  }
}

export async function deleteVehicle(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "No autorizado" };

  try {
    await prisma.vehicle.delete({
      where: { id, userId },
    });

    revalidateTag(`vehicles-${userId}`, "max");
    revalidatePath("/finance/vehicles");
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar vehículo" };
  }
}
