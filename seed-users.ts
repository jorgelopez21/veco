import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const emails = ["jolope2005@gmail.com", "luzmy0210@gmail.com"];
  for (const email of emails) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: email.split("@")[0] },
    });
  }
  console.log("Users seeded successfully");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
