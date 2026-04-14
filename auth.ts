import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (existingUser) {
        // Keep user active by touching updatedAt
        await prisma.user.update({
          where: { email: user.email },
          data: {
            name: user.name || existingUser.name,
            image: user.image || existingUser.image,
            updatedAt: new Date(),
          },
        });
        return true;
      }

      // For new signups, enforce the 50 user limit and run garbage collection
      const currentCount = await prisma.user.count();
      if (currentCount >= 50) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Delete inactive users (this cascades to all their data)
        await prisma.user.deleteMany({
          where: { updatedAt: { lt: thirtyDaysAgo } }
        });

        // Recheck capacity
        const newCount = await prisma.user.count();
        if (newCount >= 50) {
          return "/login?error=capacity_reached";
        }
      }

      // Capacity available, allow signup
      return true;
    },
  },
});
