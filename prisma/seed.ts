/**
 * prisma/seed.ts — CLI seed for clean deploys
 *
 * Usage:
 *   npx prisma db seed              → seeds demo user (contacto@minube.dev)
 *   SEED_USER_EMAIL=you@x.com npx prisma db seed  → seeds specific user
 *
 * Default data is defined in lib/provision.ts (single source of truth)
 * The same data is applied automatically on first login via auth.ts createUser event.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { provisionUser } from "../lib/provision";

async function main() {
  const targetEmail = process.env.SEED_USER_EMAIL || "contacto@minube.dev";
  console.log(`Seeding for: ${targetEmail}`);

  const user = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {},
    create: {
      email: targetEmail,
      name: targetEmail.split("@")[0],
    },
  });

  console.log(`User ID: ${user.id}`);
  await provisionUser(user.id);
  console.log("Done.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
