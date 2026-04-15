/**
 * lib/provision.ts — Single source of truth for default user data
 *
 * Called by:
 *   - auth.ts `createUser` event (first Google login)
 *   - prisma/seed.ts (CLI clean deploy)
 *
 * Canonical defaults defined in prisma/seed.sql (kept in sync manually)
 */
import { prisma } from "./prisma";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Recargas",      icon: "Car",          color: "#10b981" },
  { name: "Peajes",        icon: "Car",          color: "#b73a10" },
  { name: "Mantenimiento", icon: "Car",          color: "#30db1a" },
  { name: "Lavadas",       icon: "Car",          color: "#cfe52a" },
  { name: "Impuestos",     icon: "Car",          color: "#1042b7" },
  { name: "parqueadero",   icon: "Car",          color: "#64748b" },
];

export const DEFAULT_INCOME_CATEGORIES: { name: string; icon: string; color: string }[] = [];

export const DEFAULT_ACCOUNTS = [
  { key: "macc",   name: "Bancolombia", type: "SAVINGS", balance: 0, color: "#3b82f6" },
  { key: "cash",   name: "Efectivo",    type: "CASH",    balance: 0, color: "#10b981" },
  { key: "energy", name: "Celsia",      type: "ENERGY",  balance: 0, color: "#f59e0b" },
  { key: "tarj",   name: "TC Nu",       type: "CREDIT",  balance: 0, color: "#ec4899" },
];

export const DEFAULT_VEHICLE = {
  key:             "veh",
  brand:           "Changan",
  model:           "Deepal S05",
  batteryCapacity: 56.1,
  degradation:     0,
};

export async function provisionUser(userId: string) {
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId, name: cat.name, type: "EXPENSE" } },
      update: {},
      create: { userId, name: cat.name, type: "EXPENSE", icon: cat.icon, color: cat.color },
    });
  }

  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId, name: cat.name, type: "INCOME" } },
      update: {},
      create: { userId, name: cat.name, type: "INCOME", icon: cat.icon, color: cat.color },
    });
  }

  for (const acc of DEFAULT_ACCOUNTS) {
    await prisma.bankAccount.upsert({
      where: { id: `${acc.key}-${userId}` },
      update: {},
      create: {
        id: `${acc.key}-${userId}`,
        userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: "COP",
        color: acc.color,
      },
    });
  }

  await prisma.vehicle.upsert({
    where: { id: `${DEFAULT_VEHICLE.key}-${userId}` },
    update: {},
    create: {
      id: `${DEFAULT_VEHICLE.key}-${userId}`,
      userId,
      brand: DEFAULT_VEHICLE.brand,
      model: DEFAULT_VEHICLE.model,
      batteryCapacity: DEFAULT_VEHICLE.batteryCapacity,
      degradation: DEFAULT_VEHICLE.degradation,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isProvisioned: true },
  });
}
