import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getUserId = cache(async () => {
  const session = await auth();
  const sessionId = session?.user?.id;
  const sessionEmail = session?.user?.email;

  if (!sessionId && !sessionEmail) {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ALLOW_DEV_BYPASS === "true") {
      const devUser = await prisma.user.findFirst({ 
        select: { id: true },
        orderBy: { createdAt: 'asc' } 
      });
      return devUser?.id || null;
    }
    return null;
  }

  // 1. Try direct ID lookup first (fastest)
  if (sessionId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true }
    });
    if (user) return user.id;
  }

  // 2. Try Email lookup
  if (sessionEmail) {
    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true }
    });
    if (user) return user.id;
  }

  return null;
});

// For cases where we still need the full user (like provisioning status)
export const getAuthenticatedUser = cache(async () => {
  const userId = await getUserId();
  if (!userId) return null;
  return await prisma.user.findUnique({ where: { id: userId } });
});
