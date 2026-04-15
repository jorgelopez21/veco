import { auth } from "@/auth";
import { NeoCard } from "@/components/ui/neo-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { getTransactions } from "@/app/actions/get-transactions";
import { getCategories, getBankAccounts } from "@/app/actions/transactions";
import { getVehicles } from "@/app/actions/vehicles";
import { TransactionFilters } from "@/components/transaction-filters";
import {
  startOfMonth,
  endOfMonth,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from "date-fns";
import {
  TransactionItem,
  type Transaction,
} from "@/components/transaction-item";
import { ExportTransactions } from "@/components/export-transactions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter || "all";
  const session = await auth();
  const userId = session?.user?.id;

  // Get vehicles first to know the default
  const vehiclesRaw = await getVehicles(userId);
  const vehicles = vehiclesRaw.map(v => ({ id: v.id, brand: v.brand, model: v.model }));
  const vehicleIdParam = sp.vehicleId || "ALL";

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  const parseParamDate = (dateStr?: string, fallback: Date = new Date()) => {
    if (!dateStr) return fallback;
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : fallback;
  };

  switch (filter) {
    case "all":
      startDate = undefined;
      endDate = undefined;
      break;
    case "3days":
      startDate = startOfDay(subDays(new Date(), 2));
      endDate = endOfDay(new Date());
      break;
    case "week":
      startDate = startOfDay(subDays(new Date(), 6));
      endDate = endOfDay(new Date());
      break;
    case "month":
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
      break;
    case "custom":
      startDate = startOfDay(parseParamDate(sp.from, startOfMonth(new Date())));
      endDate = endOfDay(parseParamDate(sp.to, new Date()));
      break;
    default:
      startDate = undefined;
      endDate = undefined;
  }

  const [transactionsRaw, categories, accounts] = await Promise.all([
    getTransactions({
      startDate,
      endDate,
      categoryId: sp.category,
      accountId: sp.account,
      vehicleId: vehicleIdParam,
      type: sp.type as "INCOME" | "EXPENSE" | undefined,
    }, userId),
    getCategories(userId),
    getBankAccounts(userId),
  ]);

  const transactions = transactionsRaw as unknown as Transaction[];

  return (
    <div className="flex flex-col min-h-screen p-4 pb-24 bg-background text-foreground gap-6">
      <header className="flex items-center gap-3">
        <Link href="/finance">
          <NeoButton
            variant="secondary"
            className="gap-1.5 h-9 px-3 rounded-xl shadow-sm border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </NeoButton>
        </Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase">
          Actividad
        </h1>
      </header>

      {/* Filters Section */}
      <TransactionFilters 
        categories={categories} 
        accounts={accounts} 
        vehicles={vehicles.map(v => ({ id: v.id, brand: v.brand, model: v.model }))} 
      />

      {/* Export Section */}
      <ExportTransactions transactions={transactions} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Historial
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Desliza:</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/50">Derecha - Editar</span>
            <span className="w-1 h-1 rounded-full bg-white/5" />
            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500/50">Izquierda - Borrar</span>
          </div>
        </div>
        {transactions.length === 0 ? (
          <NeoCard className="p-12 text-center text-muted-foreground bg-white/5 border-dashed border-white/10 rounded-3xl">
            <p className="font-black uppercase tracking-widest text-[10px]">
              No hay transacciones aún
            </p>
            <p className="text-[9px] mt-2 opacity-50 uppercase font-bold">
              Empieza a registrar para verlas aquí
            </p>
          </NeoCard>
        ) : (
          transactions.map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))
        )}
      </div>
    </div>
  );
}
