import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const expenseCategories = [
    { name: "Food", icon: "Utensils", color: "#f43f5e" },
    { name: "Transport", icon: "Car", color: "#f59e0b" },
    { name: "Housing", icon: "Home", color: "#a855f7" },
    { name: "Entertainment", icon: "Gamepad2", color: "#ec4899" },
    { name: "Shopping", icon: "ShoppingBag", color: "#3b82f6" },
  ];

  const incomeCategories = [
    { name: "Salary", icon: "Briefcase", color: "#10b981" },
    { name: "Investments", icon: "TrendingUp", color: "#22c55e" },
    { name: "Freelance", icon: "Laptop", color: "#84cc16" },
  ];

  // Assuming a default user exists or we just create global categories for now
  // Since Category requires userId, we might need to skip this or create a "system" user if we want global categories.
  // BUT the requirement was "local initializes the db to input expenses".
  // So probably we need to seed a demo user?
  // Or better, let's make the categories seed relatable to the first logged in user or make them optional userId (global).
  // Checking schema... userId IS required.
  // So we can't seed categories without a user.

  // Alternative: The user asked to "locally initialize the DB to input expenses".
  // This likely means creating a demo user or just ensuring the structure is ready.
  // Since we use Auth, we can't easily predict the user ID before login.
  // I will create a script that upserts a demo user and adds categories to them.

  const demoEmail = "contacto@minube.dev";

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      id: "clx-demo-user-id-veco",
      email: demoEmail,
      name: "Demo User",
    },
  });

  console.log(`Seeding categories for user: ${user.email}`);

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: cat.name,
          type: "EXPENSE",
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        type: "EXPENSE",
        icon: cat.icon,
        color: cat.color,
      },
    });
  }

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: cat.name,
          type: "INCOME",
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        type: "INCOME",
        icon: cat.icon,
        color: cat.color,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
