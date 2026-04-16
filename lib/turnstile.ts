export async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY no está configurada. Saltando validación.");
    return true;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secret,
          response: token,
        }),
      }
    );

    const outcome = await response.json();
    return outcome.success;
  } catch (error) {
    console.error("Error validando Turnstile:", error);
    return false;
  }
}
