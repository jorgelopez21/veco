
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmnxz32uc0000jese1t6ifepf';
  
  // 1. Restaurar Usuario
  await prisma.user.create({
    data: {
      id: userId,
      email: 'jolope2005@gmail.com',
      name: 'Jorge Lopez',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocKKoyXlUN0PIFhECRb0rJu3tMH9CCiS7C6pVVXM5ioBLMnBq9xwjA=s96-c'
    }
  });

  // 2. Restaurar Categorías
  const categories = [
    { id: "cmntriaq90001n3if8q9ub4ff", name: "Recarga", icon: "Car", color: "#b73a10", type: "EXPENSE" },
    { id: "cmntpt43k000aeacae2kypks8", name: "impuestos", icon: "Car", color: "#3b82f6", type: "EXPENSE" },
    { id: "cmntpt1ai0004eaca0o0f1f0g", name: "peajes", icon: "Car", color: "#e1b05b", type: "EXPENSE" },
    { id: "cmntruuc70005n3if8p9pz7in", name: "lavadas", icon: "Car", color: "#b71093", type: "EXPENSE" },
    { id: "cmntsc6sq000mn3if1i74ne3m", name: "Mantenimiento", icon: "Car", color: "#d9dd22", type: "EXPENSE" }
  ];
  for (const c of categories) {
    await prisma.category.create({ data: { ...c as any, userId } });
  }

  // 3. Restaurar Cuentas
  const accounts = [
    { id: "cmntr7ayj0004ec6pk1gbcria", name: "Efectivo", type: "CASH", balance: -20000 },
    { id: "cmntr78420001ec6p20e3q5vn", name: "Bancolombia", type: "SAVINGS", balance: 922000, color: "#3b82f6" },
    { id: "cmntr7ayj0002ec6phi91z74n", name: "Nu", type: "CREDIT", balance: 0, color: "#84cc16" },
    { id: "test-acc-2", name: "EPM", type: "ENERGY", balance: 70000, color: "#ec4899" },
    { id: "cmntr7ayj0003ec6pmfig89ra", name: "Nequi", type: "SAVINGS", balance: -850000 }
  ];
  for (const a of accounts) {
    await prisma.bankAccount.create({ data: { ...a as any, userId } });
  }

  // 4. Restaurar Vehículo
  await prisma.vehicle.create({
    data: {
      id: "cmntrvrqq0007n3if0eq7k6hn",
      brand: "Deepal",
      model: "S05",
      batteryCapacity: 56.12,
      userId
    }
  });

  // 5. Restaurar Transacciones
  const txs = [
    { id: "cmnts6e4b000an3ifnjl29xos", amount: 45000, description: "EV:Casa|Odo:4500|25%->100%|50.0kWh | test1", date: "2026-04-11T03:33:28.239Z", type: "EXPENSE", categoryId: "cmntriaq90001n3if8q9ub4ff", accountId: "test-acc-2", vehicleId: "cmntrvrqq0007n3if0eq7k6hn", evOrigin: "Casa", kwhGrid: 50, odo: 4500, socFin: 100, socIni: 25 },
    { id: "cmnts8qgh000jn3ifqdhbjixs", amount: 78000, description: "EV:Pública Lenta|Odo:4800|25%->100%|43.3kWh", date: "2026-04-11T03:35:34.391Z", type: "EXPENSE", categoryId: "cmntriaq90001n3if8q9ub4ff", accountId: "cmntr78420001ec6p20e3q5vn", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" },
    { id: "cmntu54k8000un3ifh8vqq99k", amount: 25000, description: "EV:Casa|Odo:4700|25%->100%|27.8kWh", date: "2026-04-10T04:28:55.291Z", type: "EXPENSE", categoryId: "cmntriaq90001n3if8q9ub4ff", accountId: "test-acc-2", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" },
    { id: "cmnts6z4q000dn3ifag8b1tlm", amount: 20000, description: "test", date: "2026-04-11T03:34:23.253Z", type: "EXPENSE", categoryId: "cmntruuc70005n3if8p9pz7in", accountId: "cmntr7ayj0004ec6pk1gbcria", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" },
    { id: "cmnts7kjf000gn3ifx7f21x07", amount: 100000, description: null, date: "2026-04-11T03:35:05.404Z", type: "EXPENSE", categoryId: "cmntpt1ai0004eaca0o0f1f0g", accountId: "cmntr7ayj0003ec6pmfig89ra", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" },
    { id: "cmntscxb8000pn3if1cjalo74", amount: 650000, description: "revisión", date: "2026-04-11T03:38:53.990Z", type: "EXPENSE", categoryId: "cmntsc6sq000mn3if1i74ne3m", accountId: "cmntr7ayj0003ec6pmfig89ra", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" },
    { id: "cmnv5bddo0002d5i656veuf5k", amount: 100000, description: null, date: "2026-04-11T02:28:43.420Z", type: "EXPENSE", categoryId: "cmntpt1ai0004eaca0o0f1f0g", accountId: "cmntr7ayj0003ec6pmfig89ra", vehicleId: "cmntrvrqq0007n3if0eq7k6hn" }
  ];
  for (const t of txs) {
    await prisma.transaction.create({ data: { ...t as any, userId } });
  }

  console.log('Restauración completa');
}

main().catch(console.error).finally(() => prisma.$disconnect());
