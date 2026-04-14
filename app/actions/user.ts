"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    // Usamos deleteMany para evitar que Prisma lance error si el usuario no existe (e.g. usuario de bypass que no está en DB)
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
