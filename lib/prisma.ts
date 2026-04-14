import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
// v2: Forced refresh to include new models (Vehicle, etc.)

const prismaOptions: Prisma.PrismaClientOptions = 
  process.env.NODE_ENV === "development" 
    ? { log: ["query", "info", "warn", "error"] } 
    : {};

// Use a dummy URL if DATABASE_URL is missing during build time to prevent validation errors
if (!process.env.DATABASE_URL) {
  prismaOptions.datasources = {
    db: {
      url: "postgresql://dummy:dummy@localhost:5432/dummy",
    },
  };
}

const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
