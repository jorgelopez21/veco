
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
process.exit(0);
