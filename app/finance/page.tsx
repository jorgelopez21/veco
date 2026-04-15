import Link from "next/link";
import Image from "next/image";
import { getDashboardData } from "@/app/actions/dashboard";
import { auth } from "@/auth";
import {
  startOfMonth,
  endOfMonth,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from "date-fns";
import { TransactionItem } from "@/components/transaction-item";
import { DashboardDateFilter } from "@/components/dashboard-date-filter";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard-charts";
import { FabNewTransaction } from "@/components/fab-new-transaction";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter || "month";
  let startDate: Date;
  let endDate: Date;

  const parseParamDate = (dateStr?: string, fallback: Date = new Date()) => {
    if (!dateStr) return fallback;
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : fallback;
  };

  switch (filter) {
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
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
  }

  const session = await auth();
  const user = session?.user;
  const {
    recentTransactions,
    categoryStats,
    totalExpense,
  } = await getDashboardData(startDate, endDate, user?.id);

  return (
    <div className="flex flex-col min-h-screen pb-20 p-4 gap-3 bg-gradient-to-b from-background to-black">
      {/* Header */}
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">
            Total Gastos
          </h1>
          <div className="flex flex-col">
            <span className="text-4xl font-black bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent tracking-tighter">
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 bg-white/5 pl-4 pr-3 py-1.5 rounded-l-xl border-y border-l border-white/10 shadow-sm">
              {user?.name?.split(" ")[0]?.toUpperCase() || "USUARIO"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 bg-white/5 flex items-center justify-center">
            {user?.image ? (
              <Image 
                src={user.image} 
                alt="Profile" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-black text-primary">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Date Filter */}
      <DashboardDateFilter />

      {/* Main Charts / Summary */}
      <DashboardCharts categoryStats={categoryStats} />

      {/* Recent Transactions */}
      <section className="flex flex-col gap-4 pb-32">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Actividad Reciente
            </h2>
            <Link
              href="/finance/transactions"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
            >
              Ver todo
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Desliza:</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/50">Derecha - Editar</span>
            <span className="w-1 h-1 rounded-full bg-white/5" />
            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500/50">Izquierda - Borrar</span>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/80 text-[10px] font-black uppercase tracking-widest bg-white/5 rounded-3xl border border-dashed border-white/10">
            No hay transacciones
          </div>
        ) : (
          recentTransactions.slice(0, 5).map((t) => {
            return (
              <TransactionItem
                key={t.id}
                transaction={
                  t as unknown as Parameters<
                    typeof TransactionItem
                  >[0]["transaction"]
                }
              />
            );
          })
        )}
      </section>

      {/* Floating Action Button */}
      <FabNewTransaction />
    </div>
  );
}
