"use server";

import { verifyTurnstile } from "@/lib/turnstile";

export async function validateTurnstileAction(token: string | null) {
  if (!token) {
    return { success: false, error: "Token de seguridad faltante." };
  }

  const isValid = await verifyTurnstile(token);

  if (!isValid) {
    return { success: false, error: "Validación de seguridad fallida. Inténtalo de nuevo." };
  }

  return { success: true };
}
