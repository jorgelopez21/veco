"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  const userId = session.user.id;

  // Protección: No permitir eliminar el usuario de demo/bypass
  if (userId === "clx-demo-user-id-veco" || session.user.email === "contacto@minube.dev") {
    return { success: false, error: "No se permite eliminar el usuario de demostración" };
  }

  // Purge all caches BEFORE deletion so stale data isn't served on next login
  revalidateTag(`categories-${userId}`);
  revalidateTag(`accounts-${userId}`);
  revalidateTag(`transactions-${userId}`);
  revalidateTag(`vehicles-${userId}`);
  revalidateTag(`dashboard-${userId}`);
  revalidatePath("/finance");

  try {
    await prisma.user.deleteMany({
      where: { id: userId },
    });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }

  // signOut must be called OUTSIDE try/catch — it throws NEXT_REDIRECT internally
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
