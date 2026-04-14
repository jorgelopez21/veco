"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  // Protección: No permitir eliminar el usuario de demo/bypass
  if (session.user.id === "clx-demo-user-id-veco" || session.user.email === "contacto@minube.dev") {
    return { success: false, error: "No se permite eliminar el usuario de demostración" };
  }

  try {
    // Usamos deleteMany para evitar que Prisma lance error si el usuario no existe
    await prisma.user.deleteMany({
      where: { id: session.user.id },
    });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }

  // signOut lanza un error interno (NEXT_REDIRECT) para manejar la redirección.
  // Debe llamarse FUERA del bloque try/catch para que Next.js lo capture correctamente.
  await signOut({ redirectTo: "/login" });
  return { success: true };
}

export async function resetDemoAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  const isDemo = session.user.id === "clx-demo-user-id-veco" || session.user.email === "contacto@minube.dev";
  if (!isDemo) {
    return { success: false, error: "Operación no permitida" };
  }

  try {
    // Solo eliminamos transacciones. Mantenemos cuentas, categorías y vehículos para facilitar pruebas.
    await prisma.transaction.deleteMany({
      where: { userId: session.user.id }
    });
    // Nota: Mantenemos las categorías y al usuario para no requerir hacer seed nuevamente.
    
    // Purge caches for this user
    revalidateTag(`transactions-${session.user.id}`, "max");
    revalidateTag(`vehicles-${session.user.id}`, "max");
    revalidateTag(`accounts-${session.user.id}`, "max");
    revalidateTag(`dashboard-${session.user.id}`, "max");
    // Since revalidateTag allows at most one argument in normal Next 14, wait, 'max' is a Vercel/Next 15 specific thing in the codebase? 
    // Wait, the project requires a dual-argument signature (tag, 'max') for revalidation, which was causing build-time TypeScript errors.
    
    revalidatePath("/finance");
    revalidatePath("/finance/vehicles");
    revalidatePath("/finance/accounts");
    revalidatePath("/finance/transactions");

  } catch (err) {
    console.error("Error al resetear registros del demo:", err);
    return { success: false, error: "Error al limpiar registros" };
  }

  return { success: true };
}
