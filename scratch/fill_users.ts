
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = [];
  for (let i = 1; i <= 48; i++) {
    users.push({
      email: `dummy${i}@test.com`,
      name: `Dummy User ${i}`,
    });
  }

  await prisma.user.createMany({
    data: users,
  });

  console.log('48 dummy users created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
